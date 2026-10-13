import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useToast } from "./Toast.jsx";

const fetchInfo = (signal) => endpoints.admin.passwordInfo({ signal });

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

/** A rough guide, not a rule — the server only enforces the minimum length. */
function strength(password) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", bar: "w-1/4 bg-red-400", text: "text-red-600" };
  if (score <= 3) return { label: "Fair", bar: "w-2/4 bg-amber-400", text: "text-amber-700" };
  if (score === 4) return { label: "Good", bar: "w-3/4 bg-emerald-400", text: "text-emerald-700" };
  return { label: "Strong", bar: "w-full bg-emerald-500", text: "text-emerald-700" };
}

function PasswordField({ id, label, value, onChange, autoComplete, error, hint }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className={`field pr-11 ${error ? "field-error" : ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-400 hover:text-ink-700"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : hint}
    </div>
  );
}

export default function Security() {
  useDocumentTitle("Security");
  const showToast = useToast();

  const { data, mutate } = useApi(fetchInfo);
  const minLength = data?.minLength ?? 8;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const meter = strength(form.newPassword);

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (form.newPassword.length < minLength) found.newPassword = `Use at least ${minLength} characters.`;
    else if (form.newPassword === form.currentPassword) found.newPassword = "Choose a different password.";
    if (form.confirmPassword !== form.newPassword) found.confirmPassword = "The two new passwords do not match.";
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    setSaving(true);
    try {
      const result = await endpoints.admin.changePassword(form.currentPassword, form.newPassword);
      mutate((prev) => ({ ...prev, source: result.source, changedAt: result.changedAt }));
      setForm(EMPTY);
      setErrors({});
      showToast("Password changed. Other devices have been signed out.");
    } catch (err) {
      setErrors(err?.data?.errors || {});
      showToast(err.message || "Could not change the password. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">Security</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        Change the password used to sign in to this admin panel. Every other device that is signed in will be signed
        out; you stay signed in here.
      </p>

      {data && (
        <p className="mt-6 flex max-w-xl items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink-700">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" />
          {data.source === "env"
            ? "You are using the shared password from the server's .env file (ADMIN_PASSWORD). Set a new one below to replace it — or create your own account under Admins."
            : `${data.source === "account" ? "Your password was" : "The shared password was"} last changed ${new Date(data.changedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" noValidate>
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
          <KeyRound className="h-5 w-5 text-navy-600" />
          Change password
        </h2>

        <div className="mt-5 space-y-5">
          <PasswordField
            id="currentPassword"
            label="Current password"
            value={form.currentPassword}
            onChange={set("currentPassword")}
            autoComplete="current-password"
            error={errors.currentPassword}
          />
          <PasswordField
            id="newPassword"
            label="New password"
            value={form.newPassword}
            onChange={set("newPassword")}
            autoComplete="new-password"
            error={errors.newPassword}
            hint={
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all ${meter ? meter.bar : "w-0"}`} />
                </div>
                <p className="mt-1.5 text-xs text-ink-500">
                  {meter && <span className={`font-semibold ${meter.text}`}>{meter.label}. </span>}
                  At least {minLength} characters. A longer phrase is stronger than a short complex one.
                </p>
              </div>
            }
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
        </div>

        <button
          type="submit"
          className="btn-primary mt-6 w-full sm:w-auto"
          disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {saving ? "Saving…" : "Change password"}
        </button>
      </form>

      <p className="mt-6 max-w-xl text-xs leading-relaxed text-ink-500">
        Forgot a password? An Owner can reset it under Admins. If no Owner can sign in, run{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5">npm run admin:reset-password --prefix server -- you@example.com</code>{" "}
        on the server to get a new one.
      </p>
    </div>
  );
}
