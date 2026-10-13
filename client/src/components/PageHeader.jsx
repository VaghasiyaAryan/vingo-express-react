import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

/**
 * The banner at the top of every inner page: breadcrumb, the page's one <h1>,
 * and a line of intro. The top padding clears the fixed navbar.
 */
export default function PageHeader({ eyebrow, title, subtitle, crumb }) {
  return (
    <section className="relative overflow-hidden bg-mesh-light pt-24 pb-8 sm:pt-32 sm:pb-14 lg:pt-36 lg:pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-navy-200/25 blur-[110px]" />
        <div className="absolute bottom-0 right-[8%] h-[260px] w-[260px] rounded-full bg-orange-200/25 blur-[100px]" />
      </div>

      <div className="container-x">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
          <Link to="/" className="hover:text-navy-700">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-ink-700">{crumb ?? title}</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-4 max-w-3xl sm:mt-6"
        >
          {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
          <h1 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:mt-5 sm:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:mt-5 sm:text-lg">{subtitle}</p>}
        </motion.div>
      </div>
    </section>
  );
}
