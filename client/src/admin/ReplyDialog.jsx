import { useEffect, useState } from "react";
import { Mail, Loader2, Send, X } from "lucide-react";
import { company } from "@shared/content.js";
import { endpoints } from "@/lib/api.js";
import { useToast } from "./Toast.jsx";

function defaultSubject(row) {
  return `Re: Your enquiry with ${company.shortName}${row.productInterest ? ` — ${row.productInterest}` : ""}`;
}

function defaultMessage(row) {
  return `Hello ${row.name},\n\nThank you for your enquiry${
    row.productInterest ? ` regarding ${row.productInterest}` : ""
  }.\n\nYou can download our full product catalogue here: ${company.websiteUrl}/api/catalog\n\n`;
}

/** Icon-only trigger for the desktop table row. */
export function ReplyIconButton({ row }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Reply to ${row.name}`}
        title="Reply"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-navy-200 bg-navy-50 text-navy-700 transition-colors hover:bg-navy-100"
      >
        <Mail className="h-3.5 w-3.5" />
      </button>
      <ReplyDialog row={row} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Labeled pill trigger for the mobile card. */
export function ReplyPillButton({ row }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-navy-200 bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700 transition-colors hover:bg-navy-100"
      >
        <Mail className="h-3.5 w-3.5" />
        Reply
      </button>
      <ReplyDialog row={row} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ReplyDialog({ row, open, onClose }) {
  const [subject, setSubject] = useState(() => defaultSubject(row));
  const [message, setMessage] = useState(() => defaultMessage(row));
  const [pending, setPending] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onClose]);

  if (!open) return null;

  async function handleSend() {
    setPending(true);
    try {
      await endpoints.admin.replyToInquiry(row.id, subject, message);
      showToast(`Reply sent to ${row.name}.`);
      onClose();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm"
      onClick={() => !pending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">Reply to {row.name}</h2>
            <p className="mt-1 text-sm text-ink-500">Sends from your business mailbox to {row.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
            className="shrink-0 text-ink-400 hover:text-ink-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="field-label" htmlFor="reply-subject">
              Subject
            </label>
            <input
              id="reply-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={pending}
              className="field"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="reply-message">
              Message
            </label>
            <textarea
              id="reply-message"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={pending}
              className="field resize-y"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="btn-ghost flex-1 !justify-center disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-navy-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
