import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import Logo from "@/components/Logo.jsx";
import { company } from "@shared/content.js";
import { analytics } from "@/lib/analytics.js";

const links = [
  { to: "/about", label: "About" },
  { to: "/products", label: "Products" },
  { to: "/why-us", label: "Why Us" },
  { to: "/process", label: "Process" },
  { to: "/global-reach", label: "Global Reach" },
  { to: "/team", label: "Team" },
  { to: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (to) => pathname === to || pathname.startsWith(`${to}/`);

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

  // A route change should always close the mobile menu, even when it was
  // opened on a different page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    // A Fragment, not a single wrapping element — the mobile panel below
    // deliberately lives OUTSIDE <header>. `backdrop-blur` (applied to
    // <header> via the `glass` class once scrolled) makes an element a CSS
    // containing block for its `position: fixed` descendants, same as
    // `transform`/`filter` do. With the panel nested inside <header>, its
    // `top-20 bottom-0` was resolving against the header's own ~80px box
    // instead of the viewport the moment you'd scrolled — collapsing it to
    // a 1px sliver, so the menu looked like it silently failed to open.
    // Reproduced directly: scroll down, open the menu, panel's rendered
    // height comes back as 1px in both Chromium and WebKit; scroll position
    // 0 (header unblurred, `bg-transparent`) always worked fine. Moving the
    // panel to be a sibling of <header> keeps it positioned against the
    // real viewport regardless of scroll position or header blur state.
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-smooth ${
          scrolled ? "glass !border-x-0 !border-t-0 shadow-[0_2px_24px_rgba(15,23,42,0.05)]" : "bg-transparent"
        }`}
      >
      <nav className="container-x flex h-20 items-center justify-between" aria-label="Main">
        <Link to="/" className="shrink-0" aria-label={`${company.shortName} home`}>
          <Logo markClass="h-9 sm:h-11" />
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {links.map((link) => {
            const active = isActive(link.to);
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  aria-current={active ? "page" : undefined}
                  className={`relative text-sm font-medium transition-colors duration-300 ease-smooth after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:rounded-full after:bg-navy-500 after:transition-all after:duration-350 after:ease-smooth ${
                    active
                      ? "text-navy-700 after:w-full"
                      : "text-ink-700 hover:text-navy-700 after:w-0 hover:after:w-full"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${company.phoneHref}`}
            onClick={() => analytics.phoneClick("navbar")}
            className="flex items-center gap-2 text-sm font-semibold text-ink-700 transition-colors duration-300 ease-smooth hover:text-navy-700"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden xl:inline">{company.phoneDisplay}</span>
          </a>
          <Link to="/contact" className="btn-primary !px-5 !py-2.5">
            Get a Quote
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="rounded-lg p-2 text-ink-900 transition-colors duration-300 ease-smooth hover:bg-navy-50 lg:hidden"
        >
          {/* Both icons stay mounted and just cross-fade via a direct `animate`
              prop keyed off `open` — deliberately not AnimatePresence's
              exit-then-enter `mode="wait"` swap (what this replaced). That
              relies on Framer Motion sequencing an unmount before the new
              element's enter animation starts; in Safari/WebKit that
              sequencing can silently stall, leaving the entering icon stuck
              at its `initial` state (invisible, rotated, shrunk) forever —
              reproduced directly: computed style stayed opacity:0 in WebKit
              long after the transition should have finished, while Chromium
              settled at opacity:1 normally. Both icons always being present
              sidesteps that mount/unmount timing dependency entirely. */}
          <span className="relative flex h-6 w-6">
            <motion.span
              animate={{ opacity: open ? 0 : 1, rotate: open ? 45 : 0, scale: open ? 0.7 : 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Menu className="h-6 w-6" />
            </motion.span>
            <motion.span
              animate={{ opacity: open ? 1 : 0, rotate: open ? 0 : -45, scale: open ? 1 : 0.7 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <X className="h-6 w-6" />
            </motion.span>
          </span>
        </button>
      </nav>
      </header>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            // Fixed and full-height rather than sized to its own content — a
            // panel that only covers its own height lets whatever sits
            // beneath it in normal flow (e.g. the hero's own WhatsApp
            // button) show through the gap once scrolling is locked.
            //
            // z-40 is required, not decorative: this panel is now a sibling
            // of <header> rather than nested inside it (see the note above),
            // so it no longer inherits header's z-40 by containment. Without
            // its own z-index it's just z-auto, which puts it in the same
            // stacking bucket as any `position:relative` content on the page
            // (e.g. the Hero section) — and since that content sits later in
            // the DOM, it was winning and painting over the panel, making
            // the menu look like it silently failed to open. Confirmed via
            // document.elementFromPoint(): it returned Hero's text, not this
            // panel, at a point square inside the panel's own measured
            // bounding box.
            // A heavier variant of the header's own `glass` treatment: 2xl
            // blur instead of xl (40px vs 24px) and a lighter /45 fill
            // instead of /60, so more of the blurred page shows through
            // rather than reading as near-solid white — plus glass's own
            // shadow for some depth against the content behind it. Border
            // kept to just the top edge (mirrors the header keeping only
            // its bottom edge) as the seam between the two. A
            // `backdrop-filter` on this element doesn't create the
            // containing-block problem the header's blur caused for this
            // panel (see the z-40 note above) — that only bites
            // fixed-position *descendants*, and nothing inside here is
            // fixed.
            className="fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto border-t border-white/60 bg-white/45 shadow-glass backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
          >
            <ul className="container-x flex flex-col py-4">
              {links.map((link) => {
                const active = isActive(link.to);
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      aria-current={active ? "page" : undefined}
                      className={`block border-b border-slate-100 py-3.5 text-sm font-medium transition-colors duration-300 ease-smooth ${
                        active ? "text-navy-700" : "text-ink-700 hover:text-navy-700"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              {/* Below md the header's own phone/quote row (md:flex, above) is
                  hidden, so this is the only place to reach them — shown here
                  only in that range to avoid duplicating that row on tablet. */}
              <li className="mt-4 flex flex-col gap-3 md:hidden">
                <a
                  href={`tel:${company.phoneHref}`}
                  onClick={() => analytics.phoneClick("navbar-mobile")}
                  className="btn w-full border border-slate-200 bg-slate-50 text-navy-800 hover:border-navy-200 hover:bg-slate-100"
                >
                  <Phone className="h-4 w-4" /> {company.phoneDisplay}
                </a>
                <Link to="/contact" className="btn-primary w-full">
                  Get a Quote
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
