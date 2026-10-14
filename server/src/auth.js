import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { isProduction } from "./config.js";
import { prisma } from "./prisma.js";

/**
 * Admin sign-in.
 *
 * Each admin has an account (AdminUser): email, name, role and a salted scrypt
 * password hash. Owners can manage other admins; Editors can do everything
 * else.
 *
 * Bootstrap: until the first account exists, the shared password signs in —
 * ADMIN_PASSWORD from the environment, or the hash that replaced it when it
 * was changed from the panel. That "shared" session is treated as an Owner so
 * it can create the first account; the moment an account exists, shared
 * sessions and shared-password logins stop working.
 *
 * Session tokens are `<adminId>.<expiry>.<signature>`, signed with a random
 * server secret (stored in SiteSetting) over the admin id, expiry and a
 * fingerprint of that admin's current password hash. So changing a password
 * signs that admin out everywhere, and deleting an admin ends their sessions.
 */

export const SESSION_COOKIE = "vingo_admin";
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

const scryptAsync = promisify(scrypt);
const HASH_BYTES = 64;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;

const SHARED_ID = "shared";
const SHARED_PASSWORD_KEY = "adminPassword";
const SESSION_SECRET_KEY = "sessionSecret";

// ------------------------------------------------------------------ hashing

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const key = await scryptAsync(String(password), salt, HASH_BYTES);
  return { hash: key.toString("hex"), salt };
}

async function matchesHash(password, hash, salt) {
  const { hash: candidate } = await hashPassword(password, salt);
  return safeEqual(candidate, hash);
}

/** Short fingerprint of a password hash — part of every session signature. */
function fingerprint(value) {
  return createHmac("sha256", "vingo-fingerprint").update(String(value)).digest("hex").slice(0, 24);
}

// ------------------------------------------------------------ session secret

let sessionSecret = null;

/** A random secret created once and kept in the database, so sessions survive restarts and span processes. */
async function getSessionSecret() {
  if (sessionSecret) return sessionSecret;
  const existing = await prisma.siteSetting.findUnique({ where: { key: SESSION_SECRET_KEY } });
  if (existing?.value?.secret) return (sessionSecret = existing.value.secret);
  try {
    await prisma.siteSetting.create({
      data: { key: SESSION_SECRET_KEY, value: { secret: randomBytes(32).toString("hex") } },
    });
  } catch {
    // Another process created it first — fine, read theirs.
  }
  const row = await prisma.siteSetting.findUnique({ where: { key: SESSION_SECRET_KEY } });
  return (sessionSecret = row.value.secret);
}

// ---------------------------------------------------------- shared password

/**
 * The bootstrap password: a hash set from the panel, else ADMIN_PASSWORD.
 * Cached briefly — a change made in this process applies at once; other
 * processes (and the reset script) take effect within CACHE_MS.
 */
const CACHE_MS = 30 * 1000;
let sharedCache = null; // { value, at }

async function loadSharedCredential() {
  if (sharedCache && Date.now() - sharedCache.at < CACHE_MS) return sharedCache.value;
  let value = null;
  const row = await prisma.siteSetting.findUnique({ where: { key: SHARED_PASSWORD_KEY } });
  const v = row?.value;
  if (v && typeof v.hash === "string" && typeof v.salt === "string") {
    value = { kind: "hash", hash: v.hash, salt: v.salt, changedAt: v.changedAt ?? null };
  } else if (process.env.ADMIN_PASSWORD) {
    value = { kind: "env", password: process.env.ADMIN_PASSWORD, changedAt: null };
  }
  sharedCache = { value, at: Date.now() };
  return value;
}

async function verifyShared(password) {
  const credential = await loadSharedCredential();
  if (!credential) return false;
  if (credential.kind === "env") return safeEqual(password ?? "", credential.password);
  return matchesHash(password ?? "", credential.hash, credential.salt);
}

function sharedFingerprint(credential) {
  return fingerprint(credential.kind === "hash" ? `hash:${credential.hash}` : `env:${credential.password}`);
}

export async function changeSharedPassword(newPassword) {
  const { hash, salt } = await hashPassword(newPassword);
  const value = { hash, salt, changedAt: new Date().toISOString() };
  await prisma.siteSetting.upsert({
    where: { key: SHARED_PASSWORD_KEY },
    create: { key: SHARED_PASSWORD_KEY, value },
    update: { value },
  });
  sharedCache = { value: { kind: "hash", ...value }, at: Date.now() };
  return value.changedAt;
}

// ------------------------------------------------------------------ accounts

export async function accountsExist() {
  return (await prisma.adminUser.count()) > 0;
}

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 200) : "";
}

/** The shape every route and the client sees for "who is signed in". */
function toAdmin(user) {
  if (user.id === SHARED_ID) {
    return { id: SHARED_ID, name: "Shared admin password", email: null, role: "OWNER", shared: true };
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role, shared: false };
}

/**
 * Checks an email + password. Returns the signed-in admin, or null.
 * With no accounts yet, the shared password signs in and the email is ignored.
 */
export async function authenticate(email, password) {
  if (!(await accountsExist())) {
    return (await verifyShared(password)) ? toAdmin({ id: SHARED_ID }) : null;
  }

  const user = await prisma.adminUser.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) {
    // Same work as a real check, so response time does not reveal which emails exist.
    await hashPassword(password ?? "", "0".repeat(32));
    return null;
  }
  if (!(await matchesHash(password ?? "", user.passwordHash, user.passwordSalt))) return null;

  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return toAdmin(user);
}

/** Re-checks the signed-in admin's own password (for the change-password form). */
export async function verifyOwnPassword(admin, password) {
  if (admin.shared) return verifyShared(password);
  const user = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  return Boolean(user) && matchesHash(password ?? "", user.passwordHash, user.passwordSalt);
}

export async function setAccountPassword(id, newPassword) {
  const { hash, salt } = await hashPassword(newPassword);
  return prisma.adminUser.update({
    where: { id },
    data: { passwordHash: hash, passwordSalt: salt, passwordChangedAt: new Date() },
  });
}

// ------------------------------------------------------------------ sessions

async function sign(id, expiry, fp) {
  return createHmac("sha256", await getSessionSecret()).update(`vingo-admin:${id}:${expiry}:${fp}`).digest("hex");
}

async function fingerprintFor(id) {
  if (id === SHARED_ID) {
    const credential = await loadSharedCredential();
    return credential ? sharedFingerprint(credential) : null;
  }
  const user = await prisma.adminUser.findUnique({ where: { id }, select: { passwordHash: true } });
  return user ? fingerprint(user.passwordHash) : null;
}

/** Resolves a session token to the admin it belongs to, or null. */
async function adminFromToken(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, expiry, signature] = parts;
  if (!/^\d+$/.test(expiry) || Number(expiry) < Date.now()) return null;

  if (id === SHARED_ID) {
    // Shared-password sessions only exist until the first account is created.
    if (await accountsExist()) return null;
    const fp = await fingerprintFor(SHARED_ID);
    return fp && safeEqual(signature, await sign(id, expiry, fp)) ? toAdmin({ id: SHARED_ID }) : null;
  }

  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return null;
  return safeEqual(signature, await sign(id, expiry, fingerprint(user.passwordHash))) ? toAdmin(user) : null;
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
  // In production the site is HTTPS-only (Cloudflare redirects http, and HSTS
  // pins it), so the cookie is always Secure there — not left to how each
  // proxy hop reports the protocol.
  return { ...BASE_COOKIE_OPTIONS, secure: isProduction || req.secure };
}

/** The admin signed in on this request, or null. */
export async function currentAdmin(req) {
  return adminFromToken(req.cookies?.[SESSION_COOKIE]);
}

/** Route guard for every /api/admin endpoint. Sets `req.admin`. */
export async function requireAuth(req, res, next) {
  try {
    const admin = await currentAdmin(req);
    if (!admin) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
}

/** Route guard for owner-only endpoints. Use after requireAuth. */
export function requireOwner(req, res, next) {
  if (req.admin?.role !== "OWNER") {
    res.status(403).json({ error: "Only an Owner can manage admin accounts." });
    return;
  }
  next();
}

/** Signs `admin` in on this browser (re-issues the cookie with their current password fingerprint). */
export async function setSessionCookie(req, res, admin) {
  const expiry = Date.now() + SESSION_MS;
  const fp = await fingerprintFor(admin.id);
  if (!fp) throw new Error("Cannot start a session for an admin that does not exist.");
  res.cookie(SESSION_COOKIE, `${admin.id}.${expiry}.${await sign(admin.id, expiry, fp)}`, cookieOptionsFor(req));
}

export function clearSessionCookie(req, res) {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptionsFor(req), maxAge: undefined });
}

/** For the Security page: when the signed-in admin's password last changed, and which kind it is. */
export async function passwordInfo(admin) {
  if (admin.shared) {
    const credential = await loadSharedCredential();
    return { source: credential?.kind === "hash" ? "panel" : "env", changedAt: credential?.changedAt ?? null };
  }
  const user = await prisma.adminUser.findUnique({ where: { id: admin.id }, select: { passwordChangedAt: true } });
  return { source: "account", changedAt: user?.passwordChangedAt ?? null };
}
