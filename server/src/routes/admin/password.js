import { Router } from "express";
import { asyncRoute, clientIp } from "../../util.js";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  changeSharedPassword,
  passwordInfo,
  setAccountPassword,
  setSessionCookie,
  verifyOwnPassword,
} from "../../auth.js";
import { recordAttempt, tooManyFailures } from "../auth.js";

export const adminPasswordRouter = Router();

/** Validates a new password; returns an error message, or null when it is fine. */
export function newPasswordProblem(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return `The password must be ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} characters long.`;
  }
  return null;
}

/** When the signed-in admin's password last changed. */
adminPasswordRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    res.json({ ...(await passwordInfo(req.admin)), minLength: MIN_PASSWORD_LENGTH });
  })
);

/**
 * Changes the signed-in admin's own password. The current password is
 * required even though the request already carries a session — a session
 * cookie left on a shared computer should not be enough to lock the owner
 * out. Wrong guesses count towards the same per-IP limit as the login form.
 */
adminPasswordRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const current = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const next = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    const ip = clientIp(req);

    if (await tooManyFailures(ip)) {
      res.status(429).json({ error: "Too many attempts. Please try again in 15 minutes." });
      return;
    }

    if (!(await verifyOwnPassword(req.admin, current.slice(0, MAX_PASSWORD_LENGTH)))) {
      await recordAttempt(ip, false);
      res.status(400).json({ error: "Your current password is incorrect.", errors: { currentPassword: "Incorrect password." } });
      return;
    }

    // Deliberately not trimmed: spaces are legitimate password characters.
    const problem = newPasswordProblem(next);
    if (problem) {
      res.status(400).json({ error: problem, errors: { newPassword: `Use at least ${MIN_PASSWORD_LENGTH} characters.` } });
      return;
    }
    if (next === current) {
      res.status(400).json({
        error: "The new password must be different from the current one.",
        errors: { newPassword: "Choose a different password." },
      });
      return;
    }

    if (req.admin.shared) await changeSharedPassword(next);
    else await setAccountPassword(req.admin.id, next);

    // This admin's other sessions were just invalidated; keep this one signed in.
    await setSessionCookie(req, res, req.admin);
    res.json({ ok: true, ...(await passwordInfo(req.admin)) });
  })
);
