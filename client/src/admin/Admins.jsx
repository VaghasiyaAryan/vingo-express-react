import { useCallback, useState } from "react";
import { AlertCircle, KeyRound, Loader2, Mail, Plus, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useToast } from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

const EMPTY_FORM = { username: "", email: "", password: "", confirmPassword: "" };

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * New admins aren't self-service — the signed-in admin enters the new
 * account's full credentials, and an OTP emailed to THEIR OWN address
 * confirms the action before the account is actually created. That stops a
 * hijacked but already-open admin tab from silently adding a backdoor admin.
 */
function NewAdminPanel({ onCreated, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [sending, setSending] = useState(false);

  const [invite, setInvite] = useState(null); // { inviteId, sentTo }
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSend(event) {
    event.preventDefault();
    setFormError(null);

    if (form.password !== form.confirmPassword) {
      setFormError("Password and confirmation do not match.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setSending(true);
    try {
      const result = await endpoints.admin.createAdmin({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setInvite({ inviteId: result.inviteId, sentTo: result.sentTo });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setOtpError(null);
    setConfirming(true);
    try {
      const admin = await endpoints.admin.confirmAdmin(invite.inviteId, otp);
      onCreated(admin);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  if (invite) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Mail className="h-4 w-4 text-navy-600" />
          Enter verification code
        </div>
        <p className="mt-2 text-sm text-ink-500">
          We emailed a 6-digit code to <strong className="text-ink-700">{invite.sentTo}</strong> (your own admin
          email). Enter it below to finish creating "{form.username}".
        </p>

        <form onSubmit={handleConfirm} className="mt-5 space-y-4">
          {otpError && (
            <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {otpError}
            </p>
          )}

          <div className="max-w-[200px]">
            <label className="field-label" htmlFor="otp">
              6-digit code
            </label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              className="field text-center text-lg tracking-[0.3em]"
              placeholder="000000"
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={confirming || otp.length !== 6} className="btn-primary disabled:opacity-70">
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Confirm & Create
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <UserPlus className="h-4 w-4 text-navy-600" />
          New admin
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="text-ink-400 hover:text-ink-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSend} className="mt-5 space-y-4">
        {formError && (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {formError}
          </p>
        )}

        <div>
          <label className="field-label" htmlFor="new-username">
            Username *
          </label>
          <input id="new-username" value={form.username} onChange={set("username")} required className="field" />
        </div>

        <div>
          <label className="field-label" htmlFor="new-email">
            Email *
          </label>
          <input
            id="new-email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="them@company.com"
            required
            className="field"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="new-password">
            Password *
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set("password")}
            required
            className="field"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="new-confirm-password">
            Confirm password *
          </label>
          <input
            id="new-confirm-password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            required
            className="field"
          />
        </div>

        <p className="text-xs text-ink-500">
          We'll email a verification code to your own admin address before this account is created.
        </p>

        <button type="submit" disabled={sending} className="btn-primary disabled:opacity-70">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Send verification code
        </button>
      </form>
    </div>
  );
}

function AdminRow({ admin, isSelf, canDelete, onDeleted }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const showToast = useToast();

  async function handleDelete() {
    setDeletePending(true);
    try {
      await endpoints.admin.deleteAdmin(admin.id);
      setConfirmOpen(false);
      onDeleted(admin.id);
      showToast(`"${admin.username}" removed.`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <tr className="align-middle transition-colors hover:bg-navy-50/40">
      <td className="px-5 py-3">
        <p className="flex items-center gap-1.5 font-semibold text-ink-900">
          {admin.username}
          {isSelf && <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700">You</span>}
        </p>
      </td>
      <td className="px-5 py-3 text-ink-700">{admin.email || "—"}</td>
      <td className="px-5 py-3 text-ink-500">{formatDate(admin.createdAt)}</td>
      <td className="px-5 py-3 text-right">
        {canDelete && !isSelf && (
          <>
            <button
              type="button"
              disabled={deletePending}
              onClick={() => setConfirmOpen(true)}
              aria-label={`Remove ${admin.username}`}
              title="Remove"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              {deletePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
            <ConfirmDialog
              open={confirmOpen}
              danger
              title={`Remove "${admin.username}"?`}
              description="This can't be undone — they will immediately lose admin access."
              confirmLabel="Remove"
              pending={deletePending}
              onConfirm={handleDelete}
              onCancel={() => setConfirmOpen(false)}
            />
          </>
        )}
      </td>
    </tr>
  );
}

export default function Admins() {
  useDocumentTitle("Admins");

  const fetchAdmins = useCallback((signal) => endpoints.admin.admins({ signal }), []);
  const { data, error, loading, mutate } = useApi(fetchAdmins);

  const fetchSelf = useCallback((signal) => endpoints.admin.account({ signal }), []);
  const { data: self } = useApi(fetchSelf);

  const [panelOpen, setPanelOpen] = useState(false);
  const showToast = useToast();

  const admins = data?.admins ?? [];

  const handleCreated = useCallback(
    (admin) => {
      mutate((current) => ({ ...current, admins: [...(current?.admins ?? []), admin] }));
      setPanelOpen(false);
      showToast(`"${admin.username}" created.`);
    },
    [mutate, showToast]
  );

  const handleDeleted = useCallback(
    (id) => {
      mutate((current) => ({ ...current, admins: current.admins.filter((a) => a.id !== id) }));
    },
    [mutate]
  );

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Admins</h1>
          <p className="mt-2 text-sm text-ink-500">
            <KeyRound className="mr-1.5 inline h-3.5 w-3.5" />
            Manage who can access this dashboard.
          </p>
        </div>
        {!panelOpen && (
          <button type="button" onClick={() => setPanelOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add New Admin
          </button>
        )}
      </div>

      {panelOpen && (
        <div className="mt-8 max-w-lg">
          <NewAdminPanel onCreated={handleCreated} onClose={() => setPanelOpen(false)} />
        </div>
      )}

      {loading && !data && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading admins" />
        </div>
      )}

      {error && (
        <p className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {admins.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Username</th>
                  <th className="px-5 py-3.5 font-semibold">Email</th>
                  <th className="px-5 py-3.5 font-semibold">Created</th>
                  <th className="px-5 py-3.5 font-semibold" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((admin) => (
                  <AdminRow
                    key={admin.id}
                    admin={admin}
                    isSelf={self?.username === admin.username}
                    canDelete={admins.length > 1}
                    onDeleted={handleDeleted}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
