import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useToast } from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

export default function TeamActions({ member, onToggled, onDeleted }) {
  const [togglePending, setTogglePending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const showToast = useToast();

  async function handleToggle(event) {
    const active = event.target.checked;
    setTogglePending(true);
    try {
      await endpoints.admin.setTeamMemberActive(member.id, active);
      onToggled(member.id, active);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setTogglePending(false);
    }
  }

  async function handleDelete() {
    setDeletePending(true);
    try {
      await endpoints.admin.deleteTeamMember(member.id);
      setConfirmOpen(false);
      onDeleted(member.id);
      showToast(`"${member.name}" deleted.`);
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
            checked={member.active}
            disabled={togglePending}
            onChange={handleToggle}
            className="peer sr-only"
          />
          <span className="absolute inset-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-navy-600 peer-disabled:opacity-60" />
          <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
        </span>
        <span className="text-xs font-medium text-ink-500">{member.active ? "Active" : "Hidden"}</span>
      </label>

      <button
        type="button"
        disabled={deletePending}
        onClick={() => setConfirmOpen(true)}
        aria-label={`Delete ${member.name}`}
        title="Delete"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
      >
        {deletePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        danger
        title={`Delete "${member.name}"?`}
        description="This can't be undone — they will be removed from the Team page."
        confirmLabel="Delete"
        pending={deletePending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
