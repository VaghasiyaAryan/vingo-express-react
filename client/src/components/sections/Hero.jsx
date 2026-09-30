import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, BadgeCheck, Ship, Sparkles, Download } from "lucide-react";
import { hero, company } from "@shared/content.js";
import { LogoMark } from "@/components/Logo.jsx";
import { analytics } from "@/lib/analytics.js";

/**
 * Counts up to the stat value once it scrolls into view.
 *
 * The motion value starts AT the target rather than at zero, so the very
 * first paint already shows the real number — a visitor who lands mid-scroll,
 * or whose animation never runs, sees "20+" and never a stuck "0+". Only
 * after mount does it reset to 0 and animate back up.
 */
function StatValue({ value }) {
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? Number(match[1]) : 0;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const count = useMotionValue(target);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (!inView || !match) return;
    count.set(0);
    const controls = animate(count, target, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [inView]);

  if (!match) return <span ref={ref}>{value}</span>;

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {match[2]}
    </span>
  );
}

// slugs must match real, currently-active products — see server/prisma or
// GET /api/products. ("Onion Flakes" was never a real product; the closest
// matches (onion powder/flakes) are hidden right now, so it's swapped for
// Tomato Powder here rather than linking somewhere that 404s.)
const orbiting = [
  { label: "Mango Powder", slug: "mango-powder", top: "6%", left: "8%", delay: 0 },
  { label: "Tomato Powder", slug: "tomato-powder", top: "24%", right: "-4%", delay: 0.6 },
  { label: "Spinach Powder", slug: "spinach-powder", bottom: "16%", left: "-2%", delay: 1.2 },
  { label: "Beetroot Powder", slug: "beetroot-powder", bottom: "2%", right: "10%", delay: 1.8 },
];

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-mesh-light pt-28 pb-20 sm:pt-32 lg:pt-36 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-navy-200/25 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-orange-200/25 blur-[100px]" />
      </div>

      <div className="container-x grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="section-eyebrow"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {hero.eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.4rem]"
          >
            {hero.title}{" "}
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-navy-700 bg-clip-text text-transparent">
              {hero.titleAccent}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link to="/contact" className="btn-primary">
              Request a Quotation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="/api/catalog"
              download
              onClick={() => analytics.catalogDownload("hero")}
              // Navy is the site's other brand colour (see globals.css:
              // "orange carries the action, navy the structure"), so this
              // reads as a distinct secondary action rather than a paler
              // copy of the primary CTA's orange.
              className="btn border border-navy-300/50 bg-navy-500/10 text-navy-800 backdrop-blur-md backdrop-saturate-150 hover:bg-navy-500/20"
            >
              <Download className="h-4 w-4" />
              Download Catalogue
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500"
          >
            <span className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-navy-600" />
              Specification-matched batches
            </span>
            <span className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-navy-600" />
              Samples, LCL &amp; FCL supply
            </span>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4"
          >
            {hero.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-500">{stat.label}</dt>
                <dd className="font-display text-3xl font-bold text-orange-500">
                  <StatValue value={stat.value} />
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-square w-full max-w-[440px]"
        >
          {/* Purely decorative — the orbiting chips below are the only real
              content here, and each is its own focusable link, so aria-hidden
              stays scoped to just this ring/logo artwork rather than the
              whole container (which would hide those links from screen
              readers while leaving them visible and clickable for everyone
              else). */}
          <div aria-hidden="true">
            <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-navy-100 via-white to-orange-100 shadow-[inset_0_2px_40px_rgba(46,44,117,0.12)]" />
            <div className="absolute inset-[8%] animate-[spin_28s_linear_infinite] rounded-full border border-dashed border-orange-300/70" />
            <div className="absolute inset-[20%] animate-[spin_20s_linear_infinite_reverse] rounded-full border border-navy-200" />
            <div className="absolute inset-[26%] flex items-center justify-center rounded-full bg-white/85 shadow-glass backdrop-blur-sm">
              <LogoMark className="h-[58%]" />
            </div>
          </div>

          {orbiting.map((chip) => (
            <Link
              key={chip.label}
              to={`/products/${chip.slug}`}
              aria-label={`View ${chip.label}`}
              className="absolute animate-float rounded-full border border-white bg-white/90 px-4 py-2 text-xs font-semibold text-ink-700 shadow-glass backdrop-blur transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:border-navy-200 hover:bg-white hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              style={{
                top: chip.top,
                left: chip.left,
                right: chip.right,
                bottom: chip.bottom,
                animationDelay: `${chip.delay}s`,
              }}
            >
              {chip.label}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
