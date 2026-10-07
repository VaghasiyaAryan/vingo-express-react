import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import Logo from "@/components/Logo.jsx";
import AdminNav from "./AdminNav.jsx";
import NavigationProgress from "./NavigationProgress.jsx";
import { useSession } from "./RequireAuth.jsx";

export default function AdminLayout() {
  const { signOut } = useSession();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <NavigationProgress />
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex h-20 items-center px-6">
          <Link to="/">
            <Logo markClass="h-9" />
          </Link>
        </div>
        <div className="lg:flex-1 lg:overflow-y-auto">
          <AdminNav />
        </div>
        <div className="border-t border-slate-100 p-3">
          <button type="button" onClick={handleSignOut} className="btn-ghost w-full !py-2.5 text-sm">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
