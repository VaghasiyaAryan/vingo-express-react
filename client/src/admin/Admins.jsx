import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, RefreshCw, Trash2, UserPlus, Users } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useSession } from "./RequireAuth.jsx";
import { useToast } from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

const fetchAdmins = (signal) => endpoints.admin.admins({ signal });

const ROLE_LABEL = { OWNER: "Owner", EDITOR: "Editor" };
const ROLE_HELP = {
  OWNER: "Everything, including adding and removing admins.",
  EDITOR: "Products, enquiries, homepage and catalogue — but not admin accounts.",
};

/** A random 14-character password from an unambiguous alphabet. */
function generatePassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}

function formatDate(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked (e.g. plain-HTTP origin) — the text is still on screen to copy by hand.
        }
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-ink-700 hover:border-navy-200"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

const EMPTY_FORM = { name: "", email: "", password: "", role: "EDITOR" };

function AddAdminForm({ firstAccount, minLength, onCreated }) {
  const showToast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null); // { name, email, password } — shown once, to hand over

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await endpoints.admin.createAdmin({ ...form, role: firstAccount ? "OWNER" : form.role });
      setCreated({ name: result.admin.name, email: result.admin.email, password: form.password });
      setForm(EMPTY_FORM);
      setErrors({});
      setVisible(false);
      onCreated(result);
      showToast(firstAccount ? "Your Owner account is ready — you are now signed in with it." : `${result.admin.name} added.`);
    } catch (err) {
      setErrors(err?.data?.errors || {});
      showToast(err.message || "Could not add the admin.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
        <UserPlus className="h-5 w-5 text-navy-600" />
        {firstAccount ? "Create your Owner account" : "Add an admin"}
      </h2>

      {created && !firstAccount && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">Send these sign-in details to {created.name}:</p>
          <p className="mt-2 break-all">
            Email: <span className="font-mono">{created.email}</span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 break-all">
            Password: <span className="font-mono">{created.password}</span> <CopyButton text={created.password} />
          </p>
          <p className="mt-2 text-xs">They can change it under Security after signing in. This is the only time it is shown.</p>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="admin-name">
            Name
          </label>
          <input id="admin-name" value={form.name} onChange={set("name")} className={`field ${errors.name ? "field-error" : ""}`} required />
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="off"
            value={form.email}
            onChange={set("email")}
            className={`field ${errors.email ? "field-error" : ""}`}
            required
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="admin-password">
            {firstAccount ? "Your password" : "Password"}
          </label>
          <div className="relative">
            <input
              id="admin-password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              className={`field pr-11 ${errors.password ? "field-error" : ""}`}
              required
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-400 hover:text-ink-700"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
          ) : (
            <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-ink-500">
              <span>At least {minLength} characters.</span>
              {!firstAccount && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, password: generatePassword() }));
                    setVisible(true);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-navy-700 hover:text-navy-900"
                >
                  <RefreshCw className="h-3 w-3" /> Generate
                </button>
              )}
            </div>
          )}
        </div>
        {!firstAccount && (
          <div>
            <label className="field-label" htmlFor="admin-role">
              Role
            </label>
            <select id="admin-role" value={form.role} onChange={set("role")} className="field cursor-pointer">
              <option value="EDITOR">Editor</option>
              <option value="OWNER">Owner</option>
            </select>
            <p className="mt-1.5 text-xs text-ink-500">{ROLE_HELP[form.role]}</p>
          </div>
        )}
      </div>

      <button type="submit" className="btn-primary mt-6 w-full sm:w-auto" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {saving ? "Saving…" : firstAccount ? "Create my account" : "Add admin"}
      </button>
    </form>
  );
}

export default function Admins() {
  useDocumentTitle("Admins");
  const showToast = useToast();
  const { admin: me, setAdmin } = useSession();
  const isOwner = me?.role === "OWNER";

  const { data, error, loading, mutate, reload } = useApi(isOwner ? fetchAdmins : () => Promise.resolve(null));
  const admins = data?.admins ?? [];
  const minLength = data?.minPasswordLength ?? 8;

  const [busyId, setBusyId] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [resetResult, setResetResult] = useState(null); // { id, password }

  if (!isOwner) {
    return (
      <div className="container-x py-10">
        <h1 className="font-display text-3xl font-bold text-ink-900">Admins</h1>
        <p className="mt-4 max-w-xl rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-ink-700">
          Only an Owner can manage admin accounts. Ask an Owner if you need someone added or removed.
        </p>
      </div>
    );
  }

  function handleCreated(result) {
    mutate((prev) => ({ ...prev, admins: [...(prev?.admins ?? []), result.admin] }));
    // The first account replaces the shared-password session with this one.
    if (result.signedInAs) setAdmin({ ...result.signedInAs, shared: false });
  }

  async function changeRole(target, role) {
    setBusyId(target.id);
    try {
      const { admin } = await endpoints.admin.setAdminRole(target.id, role);
      mutate((prev) => ({ ...prev, admins: prev.admins.map((a) => (a.id === admin.id ? admin : a)) }));
      showToast(`${admin.name} is now ${ROLE_LABEL[admin.role] === "Owner" ? "an Owner" : "an Editor"}.`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmRemove() {
    const target = removing;
    setBusyId(target.id);
    try {
      await endpoints.admin.deleteAdmin(target.id);
      mutate((prev) => ({ ...prev, admins: prev.admins.filter((a) => a.id !== target.id) }));
      showToast(`${target.name} removed.`);
      setRemoving(null);
    } catch (err) {
      showToast(err.message, "error");
      setRemoving(null);
      reload();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReset() {
    const target = resetting;
    const password = generatePassword();
    setBusyId(target.id);
    try {
      await endpoints.admin.resetAdminPassword(target.id, password);
      setResetResult({ id: target.id, password });
      showToast(`New password set for ${target.name}.`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBusyId(null);
      setResetting(null);
    }
  }

  const ownerCount = admins.filter((a) => a.role === "OWNER").length;

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">Admins</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        Everyone who can sign in to this panel. <strong className="font-semibold text-ink-700">Owners</strong> can do
        everything, including managing admins. <strong className="font-semibold text-ink-700">Editors</strong> can do
        everything except manage admins.
      </p>

      {me.shared && (
        <p className="mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
          You are signed in with the shared admin password. Create your own Owner account below — you will be signed in
          with it straight away, and from then on everyone signs in with their own email and password. The shared
          password stops working.
        </p>
      )}

      {loading && !data && (
        <div className="flex min-h-[20vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading admins" />
        </div>
      )}

      {error && (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error.message}</p>
      )}

      {admins.length > 0 && (
        <ul className="mt-8 space-y-3">
          {admins.map((a) => {
            const isMe = a.id === me.id;
            const lastOwner = a.role === "OWNER" && ownerCount <= 1;
            const busy = busyId === a.id;
            return (
              <li key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-50 font-display text-sm font-bold text-navy-700">
                      {a.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
                        <span className="truncate">{a.name}</span>
                        {isMe && <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[0.7rem] font-semibold text-navy-700">You</span>}
                      </p>
                      <p className="truncate text-sm text-ink-500">{a.email}</p>
                      <p className="mt-0.5 text-xs text-ink-400">Last sign-in: {formatDate(a.lastLoginAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={a.role}
                      onChange={(e) => changeRole(a, e.target.value)}
                      disabled={isMe || busy || (lastOwner && a.role === "OWNER")}
                      aria-label={`Role for ${a.name}`}
                      title={isMe ? "You cannot change your own role" : lastOwner ? "There must always be at least one Owner" : undefined}
                      className="field cursor-pointer !w-auto !py-2 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      <option value="OWNER">Owner</option>
                      <option value="EDITOR">Editor</option>
                    </select>
                    {!isMe && (
                      <>
                        <button
                          type="button"
                          onClick={() => setResetting(a)}
                          disabled={busy}
                          className="btn-ghost !px-3 !py-2 text-xs"
                        >
                          <KeyRound className="h-3.5 w-3.5" /> Reset password
                        </button>
                        <button
                          type="button"
                          onClick={() => setRemoving(a)}
                          disabled={busy || lastOwner}
                          title={lastOwner ? "There must always be at least one Owner" : undefined}
                          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {resetResult?.id === a.id && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="flex flex-wrap items-center gap-2 break-all">
                      New password for {a.name}: <span className="font-mono">{resetResult.password}</span>
                      <CopyButton text={resetResult.password} />
                    </p>
                    <p className="mt-1 text-xs">
                      Send it to them privately. They have been signed out everywhere and can change it under Security.
                      This is the only time it is shown.
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {data && admins.length === 0 && !me.shared && (
        <p className="mt-8 flex items-center gap-2 text-sm text-ink-500">
          <Users className="h-4 w-4" /> No admin accounts yet.
        </p>
      )}

      {data && (
        <div className="mt-8 max-w-3xl">
          <AddAdminForm firstAccount={admins.length === 0} minLength={minLength} onCreated={handleCreated} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removing)}
        title={`Remove ${removing?.name}?`}
        description="They will be signed out straight away and will no longer be able to sign in. This cannot be undone — you can add them again later."
        confirmLabel="Remove"
        danger
        pending={busyId === removing?.id}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
      <ConfirmDialog
        open={Boolean(resetting)}
        title={`Reset ${resetting?.name}'s password?`}
        description="A new random password will be created and shown to you once. They will be signed out everywhere until they sign in with it."
        confirmLabel="Reset password"
        pending={busyId === resetting?.id}
        onConfirm={confirmReset}
        onCancel={() => setResetting(null)}
      />
    </div>
  );
}
