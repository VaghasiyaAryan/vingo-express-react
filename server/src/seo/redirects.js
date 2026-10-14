import { company } from "../../../shared/content.js";

/**
 * One URL per page. Search engines treat every distinct URL as a separate page,
 * so these all 301 to the single canonical form the <link rel="canonical"> and
 * the sitemap already use:
 *
 *   https://vingointernational.com/about   →  https://www.vingointernational.com/about
 *   /about/                                →  /about
 *   /About                                 →  /about
 *
 * Only page URLs are touched: /api, built assets and anything with a file
 * extension pass straight through, and only GET/HEAD requests are redirected
 * (a 301 on a POST would drop its body).
 */

const canonical = new URL(company.websiteUrl);
const canonicalHost = canonical.host.toLowerCase(); // e.g. www.vingointernational.com
const bareHost = canonicalHost.replace(/^www\./, ""); // e.g. vingointernational.com

function requestHost(req) {
  // Behind Cloudflare / the host's proxy the original Host header is preserved;
  // X-Forwarded-Host covers proxies that rewrite it.
  const forwarded = req.get("x-forwarded-host");
  return (forwarded || req.get("host") || "").split(",")[0].trim().toLowerCase();
}

export function canonicalRedirects(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (req.path.startsWith("/api/") || req.path.startsWith("/assets/")) return next();

  const lastSegment = req.path.slice(req.path.lastIndexOf("/") + 1);
  const isFile = lastSegment.includes(".");

  let path = req.path;
  if (!isFile) {
    if (path.length > 1 && path.endsWith("/")) path = path.replace(/\/+$/, "") || "/";
    // Admin routes keep their case-sensitive ids (e.g. /admin/products/:id/edit).
    if (!path.startsWith("/admin")) path = path.toLowerCase();
  }

  // Only the bare domain is sent to www — localhost, preview hosts and
  // anything else are left alone so development keeps working.
  const host = requestHost(req);
  const wrongHost = bareHost !== canonicalHost && host === bareHost;

  if (path === req.path && !wrongHost) return next();

  const query = req.originalUrl.slice(req.path.length);
  const target = wrongHost ? `${canonical.protocol}//${canonicalHost}${path}${query}` : `${path}${query}`;
  res.redirect(301, target);
}
