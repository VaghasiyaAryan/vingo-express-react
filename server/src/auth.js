import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma.js";

export const SESSION_COOKIE = "vingo_admin";
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

// ------------------------------------------------------------ password hashing
// scrypt rather than a dependency (bcrypt/argon2) — the project already has
// no auth libraries, and node:crypto covers this fine. Also reused for OTP
// codes (server/src/routes/admin/admins.js) — it's just a generic salted
// secret hash, not password-specific.

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const inputBuf = scryptSync(String(password ?? ""), salt, 64);
  if (hashBuf.length !== inputBuf.length) return false;
  return timingSafeEqual(hashBuf, inputBuf);
}

/** Six-digit numeric OTP code, cryptographically random. */
export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// -------------------------------------------------------------------- account
/**
 * Creates the first admin account from ADMIN_PASSWORD (and, if set,
 * ADMIN_USERNAME / ADMIN_EMAIL) the first time one is needed, but only when
 * no admin exists yet — after that, the database rows are the only source of
 * truth and these env vars are never consulted again.
 */
async function ensureBootstrapAdmin() {
  const count = await prisma.adminUser.count();
  if (count > 0 || !process.env.ADMIN_PASSWORD) return;

  await prisma.adminUser.create({
    data: {
      username: process.env.ADMIN_USERNAME || "admin",
      email: process.env.ADMIN_EMAIL || null,
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD),
    },
  });
}

/** True once at least one admin account exists (bootstrapping it first if needed). */
export async function dashboardReady() {
  await ensureBootstrapAdmin();
  return (await prisma.adminUser.count()) > 0;
}

export async function countAdmins() {
  return prisma.adminUser.count();
}

export async function findAdminById(id) {
  return prisma.adminUser.findUnique({ where: { id } });
}

/** Case-insensitive match against either username or email. */
export async function findAdminByIdentifier(identifier) {
  const needle = String(identifier ?? "").trim();
  if (!needle) return null;
  return prisma.adminUser.findFirst({
    where: {
      OR: [{ username: { equals: needle, mode: "insensitive" } }, { email: { equals: needle, mode: "insensitive" } }],
    },
  });
}

/**
 * Applies an /admin/settings change for one admin. `currentPassword` is
 * required for any change — username/email included — so a hijacked but
 * already-open admin tab cannot silently take over the account.
 */
export async function updateAdminAccount({ adminId, currentPassword, username, email, newPassword }) {
  const admin = await findAdminById(adminId);
  if (!admin || !verifyPasswordHash(currentPassword, admin.passwordHash)) {
    return { error: "Current password is incorrect.", status: 401 };
  }

  const cleanUsername = String(username ?? "").trim().slice(0, 80);
  if (!cleanUsername) return { error: "Username cannot be empty.", status: 400 };
  const cleanEmail = String(email ?? "").trim().slice(0, 200);

  const conflict = await prisma.adminUser.findFirst({
    where: {
      id: { not: adminId },
      OR: [
        { username: { equals: cleanUsername, mode: "insensitive" } },
        ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: "insensitive" } }] : []),
      ],
    },
  });
  if (conflict) return { error: "Another admin already uses that username or email.", status: 409 };

  const data = { username: cleanUsername, email: cleanEmail || null };

  if (newPassword) {
    if (String(newPassword).length < 8) {
      return { error: "New password must be at least 8 characters.", status: 400 };
    }
    data.passwordHash = hashPassword(newPassword);
  }

  const updated = await prisma.adminUser.update({ where: { id: adminId }, data });
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
  return createHmac("sha256", admin.passwordHash).update(`vingo-admin:${admin.id}:${expiry}`).digest("hex");
}

export async function createSessionToken(admin) {
  const expiry = Date.now() + SESSION_MS;
  return `${admin.id}.${expiry}.${sign(admin, expiry)}`;
}

function parseToken(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [adminId, expiry, signature] = parts;
  if (!adminId || !/^\d+$/.test(expiry) || Number(expiry) < Date.now()) return null;
  return { adminId, expiry, signature };
}

/** Resolves to the current admin when the request carries a valid session, else null. */
export async function authenticatedAdmin(req) {
  const parsed = parseToken(req.cookies?.[SESSION_COOKIE]);
  if (!parsed) return null;

  const admin = await findAdminById(parsed.adminId);
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

export async function setSessionCookie(req, res, admin) {
  res.cookie(SESSION_COOKIE, await createSessionToken(admin), cookieOptionsFor(req));
}

export function clearSessionCookie(req, res) {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptionsFor(req), maxAge: undefined });
}
