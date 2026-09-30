import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useToast } from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

export default function ProductActions({ product, onToggled, onDeleted }) {
  const [togglePending, setTogglePending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const showToast = useToast();

  async function handleToggle(event) {
    const active = event.target.checked;
    setTogglePending(true);
    try {
      await endpoints.admin.setProductActive(product.id, active);
      onToggled(product.id, active);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTogglePending(false);
    }
  }

  async function handleDelete() {
    setDeletePending(true);
    try {
      await endpoints.admin.deleteProduct(product.id);
      setConfirmOpen(false);
      onDeleted(product.id);
      showToast(`"${product.name}" deleted.`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="inline-flex cursor-pointer items-center gap-2">
        <span className="relative inline-flex h-5 w-9 items-center">
          <input
            type="checkbox"
            checked={product.active}
            disabled={togglePending}
            onChange={handleToggle}
            className="peer sr-only"
          />
          <span className="absolute inset-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-navy-600 peer-disabled:opacity-60" />
          <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
        </span>
        <span className="text-xs font-medium text-ink-500">{product.active ? "Active" : "Hidden"}</span>
      </label>

      <button
        type="button"
        disabled={deletePending}
        onClick={() => setConfirmOpen(true)}
        aria-label={`Delete ${product.name}`}
        title="Delete"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
      >
        {deletePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        danger
        title={`Delete "${product.name}"?`}
        description="This can't be undone — the product will be removed from the site and the catalogue."
        confirmLabel="Delete"
        pending={deletePending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
