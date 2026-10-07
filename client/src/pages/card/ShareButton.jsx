import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Async clipboard first; it's permission-gated and gets denied often enough to need a backup. */
async function copyToClipboard(text) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission denied or the document lost focus — fall through to the legacy path.
    }
  }

  // execCommand is deprecated but still succeeds inside a user gesture when the
  // Clipboard API is blocked, which is exactly the case we're covering here.
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Native share sheet on mobile — the whole point of a link-based card — with a
 * copy-the-link fallback for browsers that don't implement Web Share.
 */
export default function ShareButton({ name, role, organization }) {
  const [status, setStatus] = useState("idle"); // idle | copied | failed

  function flash(next) {
    setStatus(next);
    setTimeout(() => setStatus("idle"), 2200);
  }

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: `${name} — ${role}, ${organization}`, url });
        return;
      } catch (error) {
        // Dismissing the share sheet is a normal outcome, not something to recover from.
        if (error?.name === "AbortError") return;
      }
    }

    flash((await copyToClipboard(url)) ? "copied" : "failed");
  }

  const label = status === "copied" ? "Link copied" : status === "failed" ? "Copy failed — copy the address bar" : "Share this card";

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        aria-label={label}
        className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-navy-700 shadow-glass backdrop-blur-md transition-all duration-300 hover:bg-white active:scale-90"
      >
        {status === "copied" ? (
          <Check className="h-[1.15rem] w-[1.15rem] text-orange-500" />
        ) : (
          <Share2 className="h-[1.15rem] w-[1.15rem]" />
        )}
      </button>

      {/* A tap with no visible result reads as a broken button, so say what happened. */}
      {status !== "idle" && (
        <p
          role="status"
          className="absolute right-4 top-16 z-20 rounded-full bg-navy-900/90 px-3 py-1.5 text-[0.65rem] font-medium text-white shadow-glass"
        >
          {status === "copied" ? "Link copied" : "Copy failed"}
        </p>
      )}
    </>
  );
}
