import { NavLink } from "react-router-dom";
import { LayoutDashboard, Inbox, Package, Users, BookOpen, Activity, Settings } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/team", label: "Team", icon: Users },
  { to: "/admin/catalog", label: "Catalogue", icon: BookOpen },
  { to: "/admin/system", label: "System", icon: Activity },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminNav() {
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
      {navItems.map((item) => (
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
