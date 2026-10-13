import { NavLink } from "react-router-dom";
import { LayoutDashboard, Inbox, Package, BookOpen, House, Activity, KeyRound, Users } from "lucide-react";
import { useSession } from "./RequireAuth.jsx";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/catalog", label: "Catalogue", icon: BookOpen },
  { to: "/admin/homepage", label: "Homepage", icon: House },
  { to: "/admin/system", label: "System", icon: Activity },
  { to: "/admin/admins", label: "Admins", icon: Users, ownerOnly: true },
  { to: "/admin/security", label: "Security", icon: KeyRound },
];

export default function AdminNav() {
  const { admin } = useSession();
  const items = navItems.filter((item) => !item.ownerOnly || admin?.role === "OWNER");

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-navy-50 text-navy-700" : "text-ink-700 hover:bg-navy-50 hover:text-navy-700"
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
