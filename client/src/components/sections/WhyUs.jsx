import { ShieldCheck, Globe2, Leaf, Package, Clock, Headset } from "lucide-react";
import Reveal from "@/components/Reveal.jsx";
import { whyChooseUs } from "@shared/content.js";

const icons = {
  shield: ShieldCheck,
  globe: Globe2,
  leaf: Leaf,
  package: Package,
  clock: Clock,
  headset: Headset,
};

export default function WhyUs() {
  return (
    <section id="why-us" className="relative overflow-hidden border-y border-slate-100 bg-slate-50/60 py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-0 h-[320px] w-[320px] rounded-full bg-navy-200/30 blur-[110px]" />
        <div className="absolute bottom-0 right-[10%] h-[300px] w-[300px] rounded-full bg-orange-200/30 blur-[110px]" />
      </div>

      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Why VinGo</span>
          <h2 className="section-title mt-5">Built to be an easy supplier to work with</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Predictable quality, clear communication and paperwork that clears customs without drama.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item, i) => {
            const Icon = icons[item.icon] ?? ShieldCheck;
            return (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="group h-full rounded-2xl border border-white/60 bg-white/50 p-6 backdrop-blur-xl backdrop-saturate-150 transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-navy-200 hover:shadow-glass">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition-all duration-350 ease-smooth group-hover:scale-110 group-hover:bg-navy-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
