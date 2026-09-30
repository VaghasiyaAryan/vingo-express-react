import { Router } from "express";
import { prisma } from "../prisma.js";
import { sendMail } from "../mail.js";
import { asyncRoute, clean, escapeHtml } from "../util.js";
import { company } from "../../../shared/content.js";

export const inquiryRouter = Router();

const MAX = {
  name: 120,
  email: 160,
  phone: 40,
  company: 160,
  country: 80,
  productInterest: 80,
  quantity: 200,
  message: 4000,
};

async function sendNotification(inquiry) {
  const to = process.env.INQUIRY_NOTIFY_TO;
  if (!to) return;

  const rows = [
    ["Name", inquiry.name],
    ["Email", inquiry.email],
    ["Phone / WhatsApp", inquiry.phone],
    ["Company", inquiry.company || "—"],
    ["Country", inquiry.country || "—"],
    ["Product Interest", inquiry.productInterest || "—"],
    ["Quantity", inquiry.quantity || "—"],
    ["Message", inquiry.message],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#334155;">${label}</td><td style="padding:6px 12px;color:#0f172a;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  await sendMail({
    to,
    replyTo: inquiry.email,
    subject: `New enquiry from ${inquiry.name}${inquiry.country ? ` (${inquiry.country})` : ""}`,
    html: `<h2 style="font-family:sans-serif;color:#2e2c75;">New website enquiry — ${company.shortName}</h2><table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;">${rows}</table>`,
  });
}

// Cheap reachability/latency ping for the admin System monitor — confirms the
// route is being served without submitting anything.
inquiryRouter.head("/", (req, res) => res.status(200).end());

inquiryRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Invalid request." });
      return;
    }

    // Honeypot: bots fill hidden fields, humans never see them. Answer with a
    // plain success so the bot has nothing to learn from the response.
    if (clean(body.website, 200)) {
      res.json({ ok: true });
      return;
    }

    const data = {
      name: clean(body.name, MAX.name),
      email: clean(body.email, MAX.email),
      phone: clean(body.phone, MAX.phone),
      company: clean(body.company, MAX.company) || null,
      country: clean(body.country, MAX.country) || null,
      productInterest: clean(body.productInterest, MAX.productInterest) || null,
      quantity: clean(body.quantity, MAX.quantity) || null,
      message: clean(body.message, MAX.message),
    };

    const errors = {};
    if (data.name.length < 2) errors.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) errors.email = "Please enter a valid email address.";
    if (data.phone.replace(/\D/g, "").length < 7) errors.phone = "Please enter a valid phone number.";
    if (data.message.length < 10) errors.message = "Please tell us a little more about your requirement.";

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: "Please check the highlighted fields.", errors });
      return;
    }

    let inquiry;
    try {
      inquiry = await prisma.inquiry.create({ data });
    } catch (err) {
      console.error("Failed to save inquiry:", err);
      res.status(500).json({
        error: "We could not save your enquiry. Please try again or reach us on WhatsApp.",
      });
      return;
    }

    // Email is a best-effort extra — never fail the submission because of it.
    try {
      await sendNotification(inquiry);
    } catch (err) {
      console.error("Inquiry saved but notification email failed:", err);
    }

    res.json({ ok: true, id: inquiry.id });
  })
);
