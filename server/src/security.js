import { isProduction } from "./config.js";
import { clientIp } from "./util.js";

/* ============================================================================
 * Security headers
 * ----------------------------------------------------------------------------
 * Content-Security-Policy is the main defence against cross-site scripting:
 * the browser only runs scripts from this site, so even an injected <script>
 * tag would not execute. What each source is for:
 *   fonts.googleapis.com / fonts.gstatic.com  the Fraunces and Inter fonts
 *   img-src https:                            product photos the admin pastes
 *                                             as an external URL
 *   data: / blob:                             upload previews in the admin
 * Adding analytics (GA4, Plausible…) later means adding its domain to
 * script-src and connect-src below.
 * ==========================================================================*/
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // 'unsafe-inline' only for styles: React and the animation library set
  // inline style attributes. Scripts stay strictly same-origin.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

export function securityHeaders(req, res, next) {
  res.setHeader("Content-Security-Policy", CSP);
  // Never let another site frame this one (clickjacking). frame-ancestors in
  // the CSP covers modern browsers; X-Frame-Options covers older ones.
  res.setHeader("X-Frame-Options", "DENY");
  // Serve files only as the type we declare — an uploaded file can't be
  // sniffed into running as HTML or script.
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Only features browsers recognise — an unknown one (e.g. the retired
  // interest-cohort) makes Chrome log a console warning on every page.
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  // HTTPS only, for a year. Production only — a local http:// server must not
  // send it. Not includeSubDomains: other subdomains (mail, etc.) are not
  // managed by this app.
  if (isProduction) res.setHeader("Strict-Transport-Security", "max-age=31536000");
  // The admin area and the API are never meant to appear in search results.
  if (req.path.startsWith("/admin") || req.path.startsWith("/api/")) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
  }
  next();
}

/* ============================================================================
 * Cross-site request check
 * ----------------------------------------------------------------------------
 * Browsers send an Origin header on every POST/PUT/PATCH/DELETE. A request
 * whose Origin is a different site is refused, so another website can never
 * make a visitor's browser act on this API (CSRF) — even though the session
 * cookie is already SameSite=Lax. No CORS headers are sent anywhere, so other
 * sites cannot read API responses either.
 * ==========================================================================*/
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function sameOriginWrites(req, res, next) {
  if (!UNSAFE_METHODS.has(req.method)) return next();
  const origin = req.get("origin");
  // No Origin: not a browser cross-site request (curl, server-to-server).
  // Those carry no visitor's cookies, so there is nothing to forge.
  if (!origin) return next();

  let originHost;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    originHost = null;
  }
  const host = (req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim().toLowerCase();
  if (originHost && originHost === host) return next();

  res.status(403).json({ error: "Cross-site request refused." });
}

/* ============================================================================
 * Rate limiting
 * ----------------------------------------------------------------------------
 * A small fixed-window limiter per client IP, kept in memory. That is enough
 * for spam and abuse protection on a single server process; login attempts
 * are additionally limited in the database (see routes/auth.js), which
 * survives restarts.
 * ==========================================================================*/
export function rateLimit({ windowMs, max, message = "Too many requests. Please wait a few minutes and try again." }) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Drop expired entries once per window so the map cannot grow without bound.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip);
  }, windowMs);
  sweep.unref?.();

  return function limiter(req, res, next) {
    const ip = clientIp(req);
    const now = Date.now();
    let entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }
    entry.count += 1;

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ error: message });
      return;
    }
    next();
  };
}

/* ============================================================================
 * Upload content check
 * ----------------------------------------------------------------------------
 * The Content-Type header is whatever the uploader claims. These are the real
 * signatures at the start of each allowed format, so a renamed HTML, SVG or
 * executable file is rejected no matter what type it claims to be.
 * ==========================================================================*/
export function detectImageType(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  // AVIF: an ISO-BMFF "ftyp" box whose brand is avif or avis.
  if (buf.toString("ascii", 4, 8) === "ftyp") {
    const brands = buf.toString("ascii", 8, Math.min(buf.length, 40));
    if (brands.includes("avif") || brands.includes("avis")) return "image/avif";
  }
  return null;
}
