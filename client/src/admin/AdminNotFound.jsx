import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function AdminNotFound() {
  useDocumentTitle("Not Found");

  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-5xl font-bold text-navy-700">404</p>
      <h1 className="mt-3 font-display text-xl font-bold text-ink-900">No such admin page</h1>
      <p className="mt-2 text-sm text-ink-500">Pick a section from the sidebar, or head back to the dashboard.</p>
      <Link to="/admin" className="btn-primary mt-6">
        <LayoutDashboard className="h-4 w-4" />
        Go to dashboard
      </Link>
    </div>
  );
}
