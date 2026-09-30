import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncRoute, clean, clientIp } from "../util.js";
import {
  authenticatedAdmin,
  clearSessionCookie,
  getAdminUser,
  setSessionCookie,
  verifyCredentials,
} from "../auth.js";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ATTEMPT_RETENTION_MS = 24 * 60 * 60 * 1000;

export const authRouter = Router();

/** Cheap check the React admin shell calls before rendering a protected route. */
authRouter.get(
  "/session",
  asyncRoute(async (req, res) => {
    const admin = await authenticatedAdmin(req);
    res.json({ authenticated: Boolean(admin), username: admin?.username ?? null });
  })
);

authRouter.post(
  "/login",
  asyncRoute(async (req, res) => {
    const admin = await getAdminUser();
    if (!admin) {
      res.status(503).json({ error: "The admin dashboard is disabled — ADMIN_PASSWORD is not set." });
      return;
    }

    const identifier = clean(req.body?.identifier, 200);
    const password = clean(req.body?.password, 200);
    const ip = clientIp(req);

    // Brute-force protection. DB-backed rather than in-memory so it survives
    // restarts and holds across multiple server processes behind a load
    // balancer, neither of which share memory.
    const recentFailures = await prisma.loginAttempt.count({
      where: { ip, success: false, createdAt: { gte: new Date(Date.now() - LOGIN_WINDOW_MS) } },
    });
    if (recentFailures >= MAX_LOGIN_ATTEMPTS) {
      res.status(429).json({ error: "Too many attempts. Please try again in 15 minutes." });
      return;
    }

    const ok = verifyCredentials(admin, identifier, password);
    await prisma.loginAttempt.create({ data: { ip, success: ok } });

    try {
      await prisma.loginAttempt.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - ATTEMPT_RETENTION_MS) } },
      });
    } catch {
      // Best-effort housekeeping — never block a login on it.
    }

    if (!ok) {
      res.status(401).json({ error: "Incorrect username, email or password." });
      return;
    }

    await setSessionCookie(req, res);
    res.json({ ok: true });
  })
);

authRouter.post("/logout", (req, res) => {
  clearSessionCookie(req, res);
  res.json({ ok: true });
});
