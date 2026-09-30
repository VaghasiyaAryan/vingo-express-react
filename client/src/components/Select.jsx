import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * A custom-rendered dropdown matching the same visual language as
 * CountrySelect (rounded card, navy hover, shadow-lift popover) — used in
 * place of native <select> so every dropdown in the quotation form reads as
 * one consistent, deliberately-designed control rather than a mix of custom
 * pickers and bare OS-styled selects.
 */
export default function Select({ id, value, onChange, options, placeholder = "Select an option", ariaLabel, error = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

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
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pick(opt) {
    onChange(opt);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`field flex cursor-pointer items-center justify-between text-left ${error ? "field-error" : ""}`}
      >
        <span className={value ? "truncate text-ink-900" : "truncate text-slate-400"}>{value || placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300 ease-smooth ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift"
          >
            <ul className="menu-scroll max-h-64 overflow-y-auto py-1">
              {options.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={opt === value}
                    onClick={() => pick(opt)}
                    className={`block w-full px-3.5 py-2.5 text-left text-sm transition-colors duration-200 ease-smooth hover:bg-navy-50 ${
                      opt === value ? "bg-navy-50 font-medium text-navy-800" : "text-ink-700"
                    }`}
                  >
                    {opt}
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
