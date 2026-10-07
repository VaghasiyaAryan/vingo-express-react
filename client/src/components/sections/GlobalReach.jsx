import { Globe2, Quote } from "lucide-react";
import Reveal from "@/components/Reveal.jsx";
import { globalMarkets, testimonials } from "@shared/content.js";

export default function GlobalReach() {
  return (
    <section id="reach" className="border-y border-slate-100 bg-white py-20 lg:py-28">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">
            <Globe2 className="h-3.5 w-3.5" />
            Global Reach
          </span>
          <h2 className="section-title mt-5">Supplying buyers across continents</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Consignments prepared for the documentation and labelling norms of the markets we serve.
          </p>
        </Reveal>
      </div>

      <div className="relative mt-12 overflow-hidden py-2">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
        <div className="flex w-max animate-marquee gap-3">
          {[...globalMarkets, ...globalMarkets].map((market, i) => (
            <span
              key={`${market}-${i}`}
              className="whitespace-nowrap rounded-full border border-navy-100 bg-navy-50/70 px-5 py-2.5 text-sm font-semibold text-navy-800"
            >
              {market}
            </span>
          ))}
        </div>
      </div>

      <div className="container-x mt-16 grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal key={t.quote.slice(0, 24)} delay={i * 0.08}>
            <figure className="card h-full">
              <Quote className="h-7 w-7 text-navy-200" />
              <blockquote className="mt-4 text-sm leading-relaxed text-ink-700">{t.quote}</blockquote>
              <figcaption className="mt-6 border-t border-slate-100 pt-4">
                <span className="block text-sm font-semibold text-ink-900">{t.name}</span>
                <span className="block text-xs text-ink-500">{t.role}</span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
