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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const notice = location.state?.notice;

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
    return () => controller.abort();
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await endpoints.login(identifier, password);
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
        <p className="mt-2 text-center text-sm text-ink-500">Sign in to view website enquiries.</p>

        {notice && (
          <p className="mt-4 rounded-xl bg-navy-50 px-3.5 py-3 text-center text-sm text-navy-800">{notice}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="identifier" className="field-label">
              Username or email
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              className={`field ${error ? "field-error" : ""}`}
              placeholder="admin"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={`field ${error ? "field-error" : ""}`}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-70">
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
