import { useState } from "react";
import { Plus } from "lucide-react";
import Reveal from "@/components/Reveal.jsx";
import Breadcrumb from "@/components/Breadcrumb.jsx";
import { faqs } from "@shared/content.js";

/**
 * `page`: this section opens the FAQ page itself — breadcrumb and the page's
 * one <h1> — instead of sitting under a separate page banner.
 */
export default function Faq({ page = false }) {
  const [open, setOpen] = useState(0);
  const Heading = page ? "h1" : "h2";

  return (
    <section
      id="faq"
      className={page ? "relative overflow-hidden bg-mesh-light pt-24 pb-14 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-28" : "py-14 sm:py-20 lg:py-28"}
    >
      {page && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-0 top-0 h-[340px] w-[340px] scale-150 glow-navy" />
          <div className="absolute bottom-0 right-[6%] h-[280px] w-[280px] scale-150 glow-orange" />
        </div>
      )}
      <div className="container-x">
        {page && <Breadcrumb current="FAQ" className="mb-6 sm:mb-8" />}
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <span className="section-eyebrow">FAQ</span>
            <Heading className="section-title mt-5">{page ? "Frequently asked questions" : "Questions buyers ask us first"}</Heading>
            <p className="mt-5 text-base leading-relaxed text-ink-500">
              {page && "Samples, minimum orders, packaging, documentation and shipping — the answers buyers look for first. "}
              Still unsure about something? Message us on WhatsApp — we usually reply the same day.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map((faq, i) => {
                const isOpen = open === i;
                return (
                  <div key={faq.q}>
                    <dt>
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? -1 : i)}
                        aria-expanded={isOpen}
                        className="flex w-full items-start justify-between gap-6 py-5 text-left"
                      >
                        <span className="font-display text-base font-bold text-ink-900 sm:text-lg">{faq.q}</span>
                        <Plus
                          className={`mt-0.5 h-5 w-5 shrink-0 text-navy-600 transition-transform duration-300 ${
                            isOpen ? "rotate-45" : ""
                          }`}
                        />
                      </button>
                    </dt>
                    <dd
                      className={`grid transition-[grid-template-rows,opacity,padding] duration-300 ease-out ${
                        isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="pr-10 text-sm leading-relaxed text-ink-500">{faq.a}</p>
                      </div>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
