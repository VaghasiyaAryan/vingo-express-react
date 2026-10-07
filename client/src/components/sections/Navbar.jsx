import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import Logo from "@/components/Logo.jsx";
import { company } from "@shared/content.js";
import { analytics } from "@/lib/analytics.js";

// Absolute "/#section" rather than a bare "#section": the navbar also renders
// on /products/:slug and /card, where a bare fragment would look for a section
// that page does not have. React Router lands on the homepage and
// ScrollBehaviour scrolls to the anchor.
const links = [
  { href: "/#about", label: "About" },
  { href: "/#products", label: "Products" },
  { href: "/#why-us", label: "Why Us" },
  { href: "/#process", label: "Process" },
  { href: "/#reach", label: "Global Reach" },
  { href: "/#faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled ? "glass !border-x-0 !border-t-0 shadow-[0_2px_24px_rgba(15,23,42,0.05)]" : "bg-transparent"
      }`}
    >
      <nav className="container-x flex h-20 items-center justify-between" aria-label="Main">
        <Link to="/" className="shrink-0" aria-label={`${company.shortName} home`}>
          <Logo markClass="h-9 sm:h-11" />
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className="relative text-sm font-medium text-ink-700 transition-colors hover:text-navy-700 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-navy-500 after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${company.phoneHref}`}
            onClick={() => analytics.phoneClick("navbar")}
            className="flex items-center gap-2 text-sm font-semibold text-ink-700 transition-colors hover:text-navy-700"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden xl:inline">{company.phoneDisplay}</span>
          </a>
          <Link to="/#enquiry" className="btn-primary !px-5 !py-2.5">
            Get a Quote
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="rounded-lg p-2 text-ink-900 transition-colors hover:bg-navy-50 md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <ul className="container-x flex flex-col py-4">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-slate-100 py-3.5 text-sm font-medium text-ink-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-4 flex flex-col gap-3">
              <a
                href={`tel:${company.phoneHref}`}
                onClick={() => analytics.phoneClick("navbar-mobile")}
                className="btn-ghost w-full"
              >
                <Phone className="h-4 w-4" /> {company.phoneDisplay}
              </a>
              <Link to="/#enquiry" onClick={() => setOpen(false)} className="btn-primary w-full">
                Get a Quote
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
