import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/** "Home › About" — the visible breadcrumb at the top of inner pages. */
export default function Breadcrumb({ current, className = "" }) {
  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1.5 text-xs text-ink-500 ${className}`}>
      <Link to="/" className="hover:text-navy-700">
        Home
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="font-medium text-ink-700" aria-current="page">
        {current}
      </span>
    </nav>
  );
}
