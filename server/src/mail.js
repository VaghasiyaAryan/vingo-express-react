import { company } from "../../shared/content.js";

/**
 * Sends mail through Resend's API rather than the mailbox's own SMTP server.
 * GoDaddy's SMTP relay blocks auth attempts from cloud IPs (works fine from a
 * normal computer, always 535s from a host) — an API-based sender sidesteps
 * that entirely.
 *
 * Returns silently if not configured; throws if configured but the send
 * itself fails, so callers can distinguish "not set up" from "broke".
 */
export async function sendMail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "not-configured" };

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: `${company.shortName} <${process.env.RESEND_FROM || company.email}>`,
    to,
    replyTo,
    subject,
    html,
  });

  if (error) throw new Error(error.message || "Resend send failed");

  return { sent: true };
}
