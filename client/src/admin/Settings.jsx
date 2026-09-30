import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, KeyRound, Loader2, Save, User } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useToast } from "./Toast.jsx";

const EMPTY_FORM = { username: "", email: "", currentPassword: "", newPassword: "", confirmPassword: "" };

export default function Settings() {
  useDocumentTitle("Settings");

  const fetchAccount = useCallback((signal) => endpoints.admin.account({ signal }), []);
  const { data, error: loadError, loading } = useApi(fetchAccount);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saveError, setSaveError] = useState(null);
  const [pending, setPending] = useState(false);
  const showToast = useToast();
  const navigate = useNavigate();

  // Prefill username/email once the account loads — password fields always
  // start blank.
  useEffect(() => {
    if (!data) return;
    setForm((prev) => ({ ...prev, username: data.username ?? "", email: data.email ?? "" }));
  }, [data]);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveError(null);

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setSaveError("New password and confirmation do not match.");
      return;
    }
    if (form.newPassword && form.newPassword.length < 8) {
      setSaveError("New password must be at least 8 characters.");
      return;
    }

    setPending(true);
    try {
      const result = await endpoints.admin.updateAccount({
        currentPassword: form.currentPassword,
        username: form.username,
        email: form.email,
        newPassword: form.newPassword || undefined,
      });

      if (result.passwordChanged) {
        // The password hash signs the session, so changing it just
        // invalidated the cookie this request rode in on — sign out
        // cleanly and send the admin back to log in with the new password,
        // rather than leaving them to hit a confusing 401 on the next click.
        await endpoints.logout();
        navigate("/admin/login", {
          replace: true,
          state: { notice: "Password updated. Please sign in again." },
        });
        return;
      }

      showToast("Settings saved.");
      setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setPending(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading settings" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container-x py-10">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loadError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">Settings</h1>
      <p className="mt-2 text-sm text-ink-500">Update the admin username, email and password.</p>

      <form onSubmit={handleSubmit} className="mt-8 max-w-lg space-y-8 pb-16">
        {saveError && (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {saveError}
          </p>
        )}

        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <User className="h-4 w-4 text-navy-600" />
            Profile
          </div>

          <div>
            <label className="field-label" htmlFor="username">
              Username *
            </label>
            <input id="username" value={form.username} onChange={set("username")} required className="field" />
          </div>

          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@company.com"
              className="field"
            />
            <p className="mt-1.5 text-xs text-ink-500">Optional — lets you sign in with either your username or email.</p>
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <KeyRound className="h-4 w-4 text-navy-600" />
            Change password <span className="font-normal text-ink-500">(optional)</span>
          </div>

          <div>
            <label className="field-label" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={set("newPassword")}
              placeholder="Leave blank to keep your current password"
              className="field"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              className="field"
            />
          </div>

          <p className="text-xs text-ink-500">Changing your password signs you out of every device, this one included.</p>
        </div>

        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <label className="field-label" htmlFor="currentPassword">
              Current password * <span className="font-normal text-ink-500">(required to save any change)</span>
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={set("currentPassword")}
              required
              className="field"
            />
          </div>
        </div>

        <button type="submit" disabled={pending} className="btn-primary disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
