import { Router } from "express";
import { prisma } from "../../prisma.js";
import { sendMail } from "../../mail.js";
import { asyncRoute, clean, escapeHtml } from "../../util.js";
import { generateOtp, hashPassword, verifyPasswordHash } from "../../auth.js";

export const adminAdminsRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

/** List of admin accounts — never password hashes. */
adminAdminsRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const admins = await prisma.adminUser.findMany({
      select: { id: true, username: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    res.json({ admins });
  })
);

/**
 * Starts creating a new admin. The requester supplies the new admin's full
 * credentials directly — there's no self-service invite step for the new
 * admin. Instead, an OTP is emailed to the NEW ADMIN'S OWN address and must
 * be relayed back by whoever is setting the account up, proving that email
 * is real and reachable before the account is actually created.
 */
adminAdminsRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const username = clean(req.body?.username, 80);
    const email = clean(req.body?.email, 200).toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!username) {
      res.status(400).json({ error: "Username is required." });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters." });
      return;
    }

    const conflict = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { email: { equals: email, mode: "insensitive" } },
        ],
      },
    });
    if (conflict) {
      res.status(409).json({ error: "An admin with that username or email already exists." });
      return;
    }

    const otp = generateOtp();

    let invite;
    try {
      // Only one pending request per requester at a time — starting a new
      // one discards whatever they hadn't confirmed yet.
      await prisma.adminInvite.deleteMany({ where: { requestedById: req.admin.id } });
      invite = await prisma.adminInvite.create({
        data: {
          requestedById: req.admin.id,
          username,
          email,
          passwordHash: hashPassword(password),
          otpHash: hashPassword(otp),
          otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
        },
      });
    } catch {
      res.status(500).json({ error: "Could not start the request. Please try again." });
      return;
    }

    const html = `
      <div style="font-family:sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">
        <p>An admin account is being created for you on the VinGo International admin panel by <strong>${escapeHtml(req.admin.username)}</strong>:</p>
        <table style="border-collapse:collapse;margin:12px 0;">
          <tr><td style="padding:2px 12px 2px 0;color:#64748b;">Username</td><td><strong>${escapeHtml(username)}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#64748b;">Email</td><td><strong>${escapeHtml(email)}</strong></td></tr>
        </table>
        <p>Verification code:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;margin:8px 0;">${otp}</p>
        <p style="color:#64748b;">Share this code with ${escapeHtml(req.admin.username)} to finish setting up the account. It expires in 10 minutes. If you weren't expecting this, you can ignore this email.</p>
      </div>
    `;

    let result;
    try {
      result = await sendMail({ to: email, subject: "Your VinGo admin account — verification code", html });
    } catch (err) {
      await prisma.adminInvite.delete({ where: { id: invite.id } }).catch(() => {});
      res.status(502).json({ error: `Failed to send the verification code: ${err.message}` });
      return;
    }

    if (!result.sent) {
      await prisma.adminInvite.delete({ where: { id: invite.id } }).catch(() => {});
      res.status(503).json({ error: "Email sending isn't configured yet — set RESEND_API_KEY." });
      return;
    }

    res.json({ inviteId: invite.id, expiresAt: invite.otpExpiresAt, sentTo: email });
  })
);

/** Confirms the OTP and actually creates the account. */
adminAdminsRouter.post(
  "/:inviteId/confirm",
  asyncRoute(async (req, res) => {
    const invite = await prisma.adminInvite.findUnique({ where: { id: req.params.inviteId } });
    if (!invite || invite.requestedById !== req.admin.id) {
      res.status(404).json({ error: "No pending request found. Please start again." });
      return;
    }

    if (invite.otpExpiresAt < new Date()) {
      await prisma.adminInvite.delete({ where: { id: invite.id } }).catch(() => {});
      res.status(410).json({ error: "This code has expired. Please start again." });
      return;
    }

    if (invite.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.adminInvite.delete({ where: { id: invite.id } }).catch(() => {});
      res.status(429).json({ error: "Too many incorrect attempts. Please start again." });
      return;
    }

    const code = clean(req.body?.otp, 10);
    if (!code || !verifyPasswordHash(code, invite.otpHash)) {
      await prisma.adminInvite.update({ where: { id: invite.id }, data: { attempts: { increment: 1 } } });
      res.status(400).json({ error: "Incorrect code. Please try again." });
      return;
    }

    let admin;
    try {
      admin = await prisma.adminUser.create({
        data: { username: invite.username, email: invite.email, passwordHash: invite.passwordHash },
      });
    } catch {
      res.status(409).json({ error: "An admin with that username or email already exists." });
      return;
    }

    await prisma.adminInvite.delete({ where: { id: invite.id } }).catch(() => {});
    res.json({ id: admin.id, username: admin.username, email: admin.email });
  })
);

/** Removes an admin account. Can't remove yourself or the last remaining admin. */
adminAdminsRouter.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    if (req.params.id === req.admin.id) {
      res.status(400).json({ error: "You can't delete your own account." });
      return;
    }

    const total = await prisma.adminUser.count();
    if (total <= 1) {
      res.status(400).json({ error: "At least one admin account must remain." });
      return;
    }

    try {
      await prisma.adminUser.delete({ where: { id: req.params.id } });
    } catch {
      res.status(404).json({ error: "This admin no longer exists." });
      return;
    }

    res.json({ ok: true });
  })
);
