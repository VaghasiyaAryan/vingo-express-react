import { Router } from "express";
import { prisma } from "../../prisma.js";
import { sendMail } from "../../mail.js";
import { asyncRoute, clean, escapeHtml } from "../../util.js";

export const adminInquiriesRouter = Router();

const INQUIRY_STATUSES = ["NEW", "CONTACTED", "QUOTED", "CLOSED"];

adminInquiriesRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ inquiries });
  })
);

adminInquiriesRouter.patch(
  "/:id",
  asyncRoute(async (req, res) => {
    const status = req.body?.status;
    if (!INQUIRY_STATUSES.includes(status)) {
      res.status(400).json({ error: "Unknown status." });
      return;
    }

    try {
      const inquiry = await prisma.inquiry.update({ where: { id: req.params.id }, data: { status } });
      res.json({ inquiry });
    } catch {
      res.status(404).json({ error: "This enquiry no longer exists." });
    }
  })
);

adminInquiriesRouter.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    try {
      await prisma.inquiry.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "This enquiry no longer exists." });
    }
  })
);

/** Sends a reply directly from the admin panel via the business mailbox. */
adminInquiriesRouter.post(
  "/:id/reply",
  asyncRoute(async (req, res) => {
    const subject = clean(req.body?.subject, 200);
    const message = clean(req.body?.message, 8000);

    if (!subject || !message) {
      res.status(400).json({ error: "Subject and message are required." });
      return;
    }

    const inquiry = await prisma.inquiry.findUnique({ where: { id: req.params.id } });
    if (!inquiry) {
      res.status(404).json({ error: "This enquiry no longer exists." });
      return;
    }

    const html = `<div style="font-family:sans-serif;font-size:14px;color:#0f172a;white-space:pre-wrap;line-height:1.6;">${escapeHtml(message)}</div>`;

    let result;
    try {
      result = await sendMail({ to: inquiry.email, subject, html });
    } catch (err) {
      res.status(502).json({ error: `Failed to send: ${err.message}` });
      return;
    }

    if (!result.sent) {
      res.status(503).json({ error: "Email sending isn't configured yet — set RESEND_API_KEY." });
      return;
    }

    res.json({ ok: true });
  })
);
