import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * Wayfinding trail shown at the top of every standalone page, right below the
 * fixed navbar. `trail` is the list of crumbs after Home — the last entry is
 * usually the current page and has no `href`.
 */
export default function Breadcrumb({ trail = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="container-x flex flex-wrap items-center gap-1.5 pb-6 text-xs text-ink-500">
      <Link to="/" className="transition-colors duration-300 ease-smooth hover:text-navy-700">
        Home
      </Link>
      {trail.map((item) => (
        <Fragment key={item.label}>
          <ChevronRight className="h-3 w-3" />
          {item.href ? (
            <Link to={item.href} className="transition-colors duration-300 ease-smooth hover:text-navy-700">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-ink-700">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
