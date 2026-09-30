import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import "flag-icons/css/flag-icons.min.css";
import { countries, countryByCode } from "@shared/countries.js";

/**
 * Real flag SVGs (via the flag-icons package), not Unicode emoji — regional
 * indicator flag emoji often render as two boxed letters ("IN" instead of a
 * flag) on Windows, since not every Windows/Chrome/font combination ligates
 * the pair into a pictograph. This looks right everywhere, no font gambling.
 */
function Flag({ code, className = "" }) {
  return <span className={`fi fi-${code.toLowerCase()} shrink-0 rounded-[2px] ${className}`} />;
}

/**
 * A searchable country picker that renders its own list — used instead of a
 * native <select> so the flag icons (and their layout) render consistently
 * instead of being at the mercy of the OS's native combo-box rendering path.
 *
 * `variant="dial"` — compact trigger (flag + dial code), for the phone field.
 * `variant="country"` — trigger shows flag + full name, for destination country.
 */
export default function CountrySelect({ id, value, onChange, variant = "country", placeholder = "Select a country", ariaLabel, error = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const selected = value ? countryByCode(value) : null;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    const t = setTimeout(() => searchRef.current?.focus(), 10);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? countries.filter((c) => c.name.toLowerCase().includes(q) || c.dial.includes(q))
    : countries;

  function pick(code) {
    onChange(code);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={
          variant === "dial"
            ? "flex h-full shrink-0 items-center gap-1.5 rounded-l-xl border-r border-slate-200 bg-slate-50/70 py-3 pl-3 pr-2 text-sm text-ink-900 transition-colors duration-300 ease-smooth hover:bg-slate-100 focus:outline-none"
            : `field flex cursor-pointer items-center justify-between text-left ${error ? "field-error" : ""}`
        }
      >
        {variant === "dial" ? (
          <>
            {selected && <Flag code={selected.code} className="h-3.5 w-5" />}
            <span>{selected?.dial}</span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
          </>
        ) : (
          <>
            <span className={selected ? "flex items-center gap-2 text-ink-900" : "text-slate-400"}>
              {selected && <Flag code={selected.code} className="h-3.5 w-5" />}
              {selected?.name || placeholder}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300 ease-smooth ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full z-30 mt-1.5 w-max min-w-full max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country…"
                className="w-full min-w-0 text-sm text-ink-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <ul className="menu-scroll max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && <li className="px-3 py-2.5 text-sm text-ink-500">No matches</li>}
              {filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.code === value}
                    onClick={() => pick(c.code)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-200 ease-smooth hover:bg-navy-50 ${
                      c.code === value ? "bg-navy-50 font-medium text-navy-800" : "text-ink-700"
                    }`}
                  >
                    <Flag code={c.code} className="h-3.5 w-5" />
                    <span className="flex-1 truncate">{c.name}</span>
                    {variant === "dial" && <span className="shrink-0 text-xs text-ink-500">{c.dial}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
