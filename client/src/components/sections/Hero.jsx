import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, BadgeCheck, Ship, Sparkles } from "lucide-react";
import { hero, company, whatsappLink } from "@shared/content.js";
import { WhatsAppIcon } from "@/components/WhatsAppButton.jsx";
import { LogoMark } from "@/components/Logo.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { usePauseOffscreen } from "@/lib/usePauseOffscreen.js";

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

// Where each floating button sits. Its label and the product it opens are
// edited in Admin → Homepage.
const orbitPositions = [
  { top: "6%", left: "8%", delay: 0 },
  { top: "24%", right: "-4%", delay: 0.6 },
  { bottom: "16%", left: "-2%", delay: 1.2 },
  { bottom: "2%", right: "10%", delay: 1.8 },
];

const fetchHeroItems = (signal) => endpoints.heroItems({ signal, background: true });

export default function Hero() {
  // Buttons appear once loaded rather than flashing the defaults first; if the
  // request fails, the defaults are the fallback.
  const { data, error } = useApi(fetchHeroItems);
  const items = data?.items ?? (error ? hero.floatingProducts : null);
  const [orbitRef, orbitPaused] = usePauseOffscreen();

  return (
    <section id="top" className="relative overflow-hidden bg-mesh-light pt-24 pb-12 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 scale-150 glow-navy" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] scale-150 glow-orange" />
      </div>

      <div className="container-x grid items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-eyebrow"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {hero.eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
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
            transition={{ duration: 0.7, delay: 0.16 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-ink-500 sm:text-lg"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link to="/contact" className="btn-primary">
              Request a Quotation
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn border border-[#25D366]/30 bg-[#25D366]/10 text-[#128C4A] hover:bg-[#25D366]/20"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Chat on WhatsApp
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.34 }}
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
            transition={{ duration: 0.7, delay: 0.42 }}
            className="mt-9 grid max-w-lg grid-cols-2 gap-x-6 gap-y-6 sm:mt-12 sm:grid-cols-4 sm:gap-y-7"
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
          ref={orbitRef}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`relative mx-auto aspect-square w-full max-w-[320px] sm:max-w-[440px] ${orbitPaused}`}
        >
          {/* Decorative rings and logo — hidden from screen readers; the
              floating buttons below are real links and stay reachable.
              Each moving piece gets its own GPU layer (will-change) so rotating
              or floating it never repaints the rest. No backdrop-blur here: the
              logo sits over a spinning ring and was being re-blurred every frame. */}
          <div aria-hidden="true">
            <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-navy-100 via-white to-orange-100 shadow-[inset_0_2px_40px_rgba(46,44,117,0.12)]" />
            <div className="absolute inset-[8%] animate-[spin_28s_linear_infinite] rounded-full border border-dashed border-orange-300/70 [will-change:transform]" />
            <div className="absolute inset-[20%] animate-[spin_20s_linear_infinite_reverse] rounded-full border border-navy-200 [will-change:transform]" />

            <div className="absolute inset-[26%] flex items-center justify-center rounded-full bg-white/95 shadow-glass">
              <LogoMark className="h-[58%]" />
            </div>
          </div>

          {items?.map((item, i) => {
            const chip = orbitPositions[i];
            if (!chip) return null;
            // No product chosen (or it has since been hidden) — open the catalogue.
            const href = item.slug ? `/products/${item.slug}` : "/products";
            // Fade-in (framer-motion) on the outer wrapper, the endless bob (CSS)
            // on the inner one. The bob runs on desktop only — see
            // .float-on-desktop in globals.css for why phones skip it.
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: chip.delay * 0.25 }}
                className="absolute z-10"
                style={{ top: chip.top, left: chip.left, right: chip.right, bottom: chip.bottom }}
              >
                <div className="float-on-desktop" style={{ animationDelay: `${chip.delay}s` }}>
                  <Link
                    to={href}
                    className="inline-flex items-center rounded-full border border-white bg-white/95 px-4 py-2 text-xs font-semibold text-ink-700 shadow-glass transition-[color,background-color,border-color,box-shadow] duration-300 hover:border-orange-200 hover:bg-white hover:text-navy-700 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
                  >
                    {item.label}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
