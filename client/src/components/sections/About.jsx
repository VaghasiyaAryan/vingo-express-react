import { Check } from "lucide-react";
import Reveal from "@/components/Reveal.jsx";
import { about, processSteps } from "@shared/content.js";

export default function About() {
  return (
    <section id="about" className="relative border-y border-slate-100 bg-white py-20 lg:py-28">
      <div className="container-x grid gap-14 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="section-eyebrow">About Us</span>
          <h2 className="section-title mt-5">{about.title}</h2>
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
        </Reveal>

        <Reveal delay={0.12} className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-navy-200/70 via-orange-100/40 to-orange-200/60 blur-2xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            {processSteps.slice(0, 4).map((step, i) => (
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
    </section>
  );
}
