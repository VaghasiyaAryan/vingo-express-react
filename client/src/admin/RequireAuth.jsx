import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { endpoints } from "@/lib/api.js";

/**
 * Session state for the admin area.
 *
 * The session itself is an httpOnly cookie the browser cannot read, so
 * "am I signed in?" is a question only the server can answer. This asks once
 * on mount and hands the answer down; `signOut` clears it both ways.
 */
const SessionContext = createContext(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside the admin routes");
  return ctx;
}

export default function RequireAuth({ children }) {
  const location = useLocation();
  // `admin` is who is signed in: { id, name, email, role: "OWNER" | "EDITOR", shared }.
  const [state, setState] = useState({ status: "checking", authenticated: false, admin: null });

  const check = useCallback(async (signal) => {
    try {
      const { authenticated, admin } = await endpoints.session({ signal });
      setState({ status: "ready", authenticated, admin: admin ?? null });
    } catch (err) {
      if (err?.name === "AbortError") return;
      // Treat an unreachable server as signed out rather than locking the
      // user into a spinner they cannot escape.
      setState({ status: "ready", authenticated: false, admin: null });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    check(controller.signal);
    return () => controller.abort();
  }, [check]);

  const signOut = useCallback(async () => {
    try {
      await endpoints.logout();
    } finally {
      setState({ status: "ready", authenticated: false, admin: null });
    }
  }, []);

  /** After the server switches who this browser is signed in as (e.g. the first account was just created). */
  const setAdmin = useCallback((admin) => setState((prev) => ({ ...prev, admin })), []);

  if (state.status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Checking your session" />
      </div>
    );
  }

  if (!state.authenticated) {
    // `state.from` lets the login screen send the user back where they were.
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return (
    <SessionContext.Provider value={{ admin: state.admin, setAdmin, signOut, recheck: check }}>
      {children}
    </SessionContext.Provider>
  );
}
