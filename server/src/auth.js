import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "vingo_admin";
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

/**
 * The admin password doubles as the HMAC key for session tokens: changing it
 * invalidates every issued session, which is the behaviour you want from a
 * password change. There is no user table to hang a separate secret off.
 */
function secret() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set — the admin dashboard is disabled.");
  return password;
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyPassword(input) {
  return safeEqual(input ?? "", secret());
}

function sign(expiry) {
  return createHmac("sha256", secret()).update(`vingo-admin:${expiry}`).digest("hex");
}

export function createSessionToken() {
  const expiry = Date.now() + SESSION_MS;
  return `${expiry}.${sign(expiry)}`;
}

export function isValidToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [expiry, signature] = token.split(".");
  if (!/^\d+$/.test(expiry) || Number(expiry) < Date.now()) return false;
  return safeEqual(signature, sign(expiry));
}

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  // The API and the app are served from the same origin (Express in
  // production, the Vite proxy in development), so "lax" is enough to keep
  // the cookie off cross-site requests without breaking normal navigation.
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MS,
};

/**
 * `secure` follows the actual request protocol rather than NODE_ENV.
 *
 * A cookie marked Secure is simply not stored by the browser over plain HTTP,
 * which would make production logins fail silently — and this server can be
 * run anywhere, including behind a proxy that does not terminate TLS. With
 * `trust proxy` set, `req.secure` reads X-Forwarded-Proto, so an HTTPS
 * deployment still gets the flag and an internal HTTP one still works.
 */
export function cookieOptionsFor(req) {
  return { ...BASE_COOKIE_OPTIONS, secure: req.secure };
}

/** True when the request carries a valid, unexpired admin session cookie. */
export function isAuthenticated(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  return isValidToken(req.cookies?.[SESSION_COOKIE]);
}

/** Route guard for every /api/admin endpoint. */
export function requireAuth(req, res, next) {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function setSessionCookie(req, res) {
  res.cookie(SESSION_COOKIE, createSessionToken(), cookieOptionsFor(req));
}

export function clearSessionCookie(req, res) {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptionsFor(req), maxAge: undefined });
}
