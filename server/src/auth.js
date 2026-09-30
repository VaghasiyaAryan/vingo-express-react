import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma.js";

export const SESSION_COOKIE = "vingo_admin";
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;
const ADMIN_ID = "admin";

// ------------------------------------------------------------ password hashing
// scrypt rather than a dependency (bcrypt/argon2) — the project already has
// no auth libraries, and node:crypto covers this fine for a single account.

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const inputBuf = scryptSync(String(password ?? ""), salt, 64);
  if (hashBuf.length !== inputBuf.length) return false;
  return timingSafeEqual(hashBuf, inputBuf);
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// -------------------------------------------------------------------- account
/**
 * The single admin account, created lazily from ADMIN_PASSWORD (and, if set,
 * ADMIN_USERNAME / ADMIN_EMAIL) the first time it is needed. After that this
 * database row is the source of truth — /admin/settings edits it directly,
 * and the environment variables are never consulted again. Returns null when
 * neither the row nor ADMIN_PASSWORD exists, which is the "dashboard
 * disabled" state.
 */
export async function getAdminUser() {
  const existing = await prisma.adminUser.findUnique({ where: { id: ADMIN_ID } });
  if (existing) return existing;
  if (!process.env.ADMIN_PASSWORD) return null;

  return prisma.adminUser.create({
    data: {
      id: ADMIN_ID,
      username: process.env.ADMIN_USERNAME || "admin",
      email: process.env.ADMIN_EMAIL || null,
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD),
    },
  });
}

/** Case-insensitive match against either the username or the email. */
function matchesIdentifier(admin, identifier) {
  const needle = String(identifier ?? "").trim().toLowerCase();
  if (!needle) return false;
  if (needle === admin.username.toLowerCase()) return true;
  return Boolean(admin.email) && needle === admin.email.toLowerCase();
}

export function verifyCredentials(admin, identifier, password) {
  return matchesIdentifier(admin, identifier) && verifyPasswordHash(password, admin.passwordHash);
}

/**
 * Applies an /admin/settings change. `currentPassword` is required for any
 * change — username/email included — so a hijacked but already-open admin
 * tab cannot silently take over the account.
 */
export async function updateAdminAccount({ currentPassword, username, email, newPassword }) {
  const admin = await getAdminUser();
  if (!admin || !verifyPasswordHash(currentPassword, admin.passwordHash)) {
    return { error: "Current password is incorrect.", status: 401 };
  }

  const cleanUsername = String(username ?? "").trim().slice(0, 80);
  if (!cleanUsername) return { error: "Username cannot be empty.", status: 400 };
  const cleanEmail = String(email ?? "").trim().slice(0, 200);

  const data = { username: cleanUsername, email: cleanEmail || null };

  if (newPassword) {
    if (String(newPassword).length < 8) {
      return { error: "New password must be at least 8 characters.", status: 400 };
    }
    data.passwordHash = hashPassword(newPassword);
  }

  const updated = await prisma.adminUser.update({ where: { id: ADMIN_ID }, data });
  return { admin: updated, passwordChanged: Boolean(newPassword) };
}

// --------------------------------------------------------------- session tokens
/**
 * The admin's password hash doubles as the HMAC key for session tokens —
 * changing the password changes the hash, which instantly invalidates every
 * issued session (including, deliberately, the one that just changed it —
 * the settings page signs the admin out and back in to the fresh session).
 */
function sign(admin, expiry) {
  return createHmac("sha256", admin.passwordHash).update(`vingo-admin:${expiry}`).digest("hex");
}

export async function createSessionToken() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("No admin account configured — ADMIN_PASSWORD is not set.");
  const expiry = Date.now() + SESSION_MS;
  return `${expiry}.${sign(admin, expiry)}`;
}

function parseToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [expiry, signature] = token.split(".");
  if (!/^\d+$/.test(expiry) || Number(expiry) < Date.now()) return null;
  return { expiry, signature };
}

/** Resolves to the current admin when the request carries a valid session, else null. */
export async function authenticatedAdmin(req) {
  const parsed = parseToken(req.cookies?.[SESSION_COOKIE]);
  if (!parsed) return null;

  const admin = await getAdminUser();
  if (!admin) return null;

  return safeEqual(parsed.signature, sign(admin, parsed.expiry)) ? admin : null;
}

export async function isAuthenticated(req) {
  return Boolean(await authenticatedAdmin(req));
}

/** Route guard for every /api/admin endpoint. */
export async function requireAuth(req, res, next) {
  const admin = await authenticatedAdmin(req);
  if (!admin) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.admin = admin;
  next();
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

export async function setSessionCookie(req, res) {
  res.cookie(SESSION_COOKIE, await createSessionToken(), cookieOptionsFor(req));
}

export function clearSessionCookie(req, res) {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptionsFor(req), maxAge: undefined });
}
