import { useState } from "react";
import { Plus } from "lucide-react";
import Reveal from "@/components/Reveal.jsx";
import { faqs } from "@shared/content.js";

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <span className="section-eyebrow">FAQ</span>
          <h2 className="section-title mt-5">Questions buyers ask us first</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
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
                    className={`grid transition-all duration-300 ease-out ${
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
    </section>
  );
}
