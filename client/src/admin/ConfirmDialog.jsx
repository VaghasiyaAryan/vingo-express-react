import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm"
      onClick={() => !pending && onCancel()}
    >
      <div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${danger ? "bg-red-50 text-red-600" : "bg-navy-50 text-navy-700"}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h2 className="mt-4 font-display text-lg font-bold text-ink-900">{title}</h2>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{description}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} disabled={pending} className="btn-ghost flex-1 !justify-center disabled:opacity-60">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-navy-700 hover:bg-navy-800"
            }`}
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
