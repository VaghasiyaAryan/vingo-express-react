import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import Reveal from "@/components/Reveal.jsx";
import Breadcrumb from "@/components/Breadcrumb.jsx";
import { about, hero, processSteps } from "@shared/content.js";

/**
 * Who we are.
 *
 * On the homepage (`moreLink`) it is a section with a link through to the
 * About page, and its side cards preview the first process steps.
 *
 * As the opening of the About page (`page`) it IS the page header — breadcrumb
 * and the page's one <h1> — so there is a single introduction instead of a
 * banner followed by a second "About Us" block. Its side cards show the
 * business's key figures, since the full process follows further down the page.
 */
export default function About({ moreLink = false, page = false }) {
  const Heading = page ? "h1" : "h2";

  return (
    <section
      id="about"
      className={`relative ${
        page
          ? "overflow-hidden bg-mesh-light pt-24 pb-14 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-28"
          : "border-y border-slate-100 bg-white py-14 sm:py-20 lg:py-28"
      }`}
    >
      {page && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/3 top-0 h-[360px] w-[360px] scale-150 glow-navy" />
          <div className="absolute bottom-0 right-[8%] h-[300px] w-[300px] scale-150 glow-orange" />
        </div>
      )}

      <div className="container-x">
        {page && <Breadcrumb current="About" className="mb-6 sm:mb-8" />}

        <div className="grid gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <span className="section-eyebrow">{page ? "About VinGo International" : "About Us"}</span>
            <Heading className="section-title mt-5">{about.title}</Heading>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-ink-500">
              {about.paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {about.highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-ink-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            {moreLink && (
              <Link
                to="/about"
                className="group/more mt-9 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700"
              >
                More about us
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/more:translate-x-1" />
              </Link>
            )}
          </Reveal>

          <Reveal delay={0.12} className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-navy-200/70 via-orange-100/40 to-orange-200/60 blur-2xl" />
            {/* Key figures sit two-by-two even on phones, so they stay compact. */}
            <div className={`grid gap-4 ${page ? "grid-cols-2" : "sm:grid-cols-2"}`}>
              {page
                ? hero.stats.map((stat, i) => (
                    <div key={stat.label} className={`glass-card !p-4 sm:!p-7 ${i % 2 === 1 ? "sm:mt-8" : ""}`}>
                      <p className="font-display text-3xl font-bold text-orange-500 sm:text-4xl">{stat.value}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-700 sm:text-sm">{stat.label}</p>
                    </div>
                  ))
                : processSteps.slice(0, 4).map((step, i) => (
                    <div
                      key={step.step}
                      className={`glass-card hover:-translate-y-1 hover:shadow-lift ${i % 2 === 1 ? "sm:mt-8" : ""}`}
                    >
                      <span className="font-display text-2xl font-bold text-navy-300">{step.step}</span>
                      <h3 className="mt-3 font-display text-lg font-bold text-ink-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.description}</p>
                    </div>
                  ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
