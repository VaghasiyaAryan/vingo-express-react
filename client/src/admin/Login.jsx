import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import Logo from "@/components/Logo.jsx";
import { endpoints } from "@/lib/api.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function Login() {
  useDocumentTitle("Admin Login");

  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  // Before the first admin account exists, only the shared password is asked for.
  const [accountsExist, setAccountsExist] = useState(true);

  // Already signed in? Skip the form.
  useEffect(() => {
    const controller = new AbortController();
    endpoints
      .session({ signal: controller.signal })
      .then(({ authenticated }) => {
        if (authenticated) navigate("/admin", { replace: true });
      })
      .catch(() => {
        // Not signed in, or the server is unreachable — either way, show the form.
      });
    endpoints
      .loginSetup({ signal: controller.signal })
      .then((setup) => setAccountsExist(setup.accountsExist))
      .catch(() => {
        // Keep asking for an email — the safer default.
      });
    return () => controller.abort();
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await endpoints.login(accountsExist ? email : "", password);
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mesh-light px-5 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-glass">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-8 text-center font-display text-2xl font-bold text-ink-900">Admin Access</h1>
        <p className="mt-2 text-center text-sm text-ink-500">
          {accountsExist ? "Sign in with your admin email and password." : "Sign in with the shared admin password."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          {accountsExist && (
            <div className="mb-4">
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                className={`field ${error ? "field-error" : ""}`}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className={`field ${error ? "field-error" : ""}`}
            placeholder={accountsExist ? "Your password" : "Enter admin password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus={!accountsExist}
          />

          {error && (
            <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary mt-6 w-full disabled:opacity-70">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" /> Sign In
              </>
            )}
          </button>
        </form>

        <Link to="/" className="mt-6 block text-center text-xs text-ink-500 hover:text-navy-700">
          ← Back to website
        </Link>
      </div>
    </main>
  );
}
