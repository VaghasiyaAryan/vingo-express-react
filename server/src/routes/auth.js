import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncRoute, clientIp } from "../util.js";
import { recordAudit } from "../audit.js";
import {
  MAX_PASSWORD_LENGTH,
  accountsExist,
  authenticate,
  clearSessionCookie,
  currentAdmin,
  setSessionCookie,
} from "../auth.js";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

export const authRouter = Router();

/**
 * Brute-force protection, shared by login and the password-change form.
 * DB-backed rather than in-memory so it survives restarts and holds across
 * multiple server processes behind a load balancer, neither of which share
 * memory.
 */
export async function tooManyFailures(ip) {
  const recentFailures = await prisma.loginAttempt.count({
    where: { ip, success: false, createdAt: { gte: new Date(Date.now() - LOGIN_WINDOW_MS) } },
  });
  return recentFailures >= MAX_LOGIN_ATTEMPTS;
}

export async function recordAttempt(ip, success) {
  await prisma.loginAttempt.create({ data: { ip, success } });
}

/** Cheap check the React admin shell calls before rendering a protected route. */
authRouter.get(
  "/session",
  asyncRoute(async (req, res) => {
    const admin = await currentAdmin(req);
    res.json({ authenticated: Boolean(admin), admin });
  })
);

/**
 * What the login screen should ask for: an email + password once accounts
 * exist, or just the shared password before the first one is created.
 */
authRouter.get(
  "/setup",
  asyncRoute(async (req, res) => {
    res.json({ accountsExist: await accountsExist() });
  })
);

authRouter.post(
  "/login",
  asyncRoute(async (req, res) => {
    // Not trimmed: spaces are legitimate password characters.
    const password = typeof req.body?.password === "string" ? req.body.password.slice(0, MAX_PASSWORD_LENGTH) : "";
    const email = req.body?.email;
    const ip = clientIp(req);

    // Who the attempt was for, for the activity log — the email typed, never
    // the password. If the email box holds something that isn't an email (a
    // password typed into the wrong field), it is not recorded.
    const typed = typeof email === "string" ? email.trim().toLowerCase() : "";
    const triedAs = !typed ? "shared password" : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typed) ? typed : "(not an email address)";

    if (await tooManyFailures(ip)) {
      await recordAudit({ req, actor: triedAs, action: "Sign-in blocked (too many attempts)", status: 429 });
      res.status(429).json({ error: "Too many attempts. Please try again in 15 minutes." });
      return;
    }

    const admin = await authenticate(email, password);
    const ok = Boolean(admin);
    await recordAttempt(ip, ok);

    try {
      await prisma.loginAttempt.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - ATTEMPT_RETENTION_MS) } },
      });
    } catch {
      // Best-effort housekeeping — never block a login on it.
    }

    if (!ok) {
      // One message for "no such email" and "wrong password", so the form
      // does not reveal which emails have accounts.
      const withAccounts = await accountsExist();
      await recordAudit({ req, actor: triedAs, action: "Failed sign-in", status: 401 });
      res.status(401).json({ error: withAccounts ? "Incorrect email or password." : "Incorrect password." });
      return;
    }

    await setSessionCookie(req, res, admin);
    await recordAudit({ req, admin, action: "Signed in", status: 200 });
    res.json({ ok: true, admin });
  })
);

authRouter.post(
  "/logout",
  asyncRoute(async (req, res) => {
    const admin = await currentAdmin(req);
    clearSessionCookie(req, res);
    if (admin) await recordAudit({ req, admin, action: "Signed out", status: 200 });
    res.json({ ok: true });
  })
);
