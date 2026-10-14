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
    <section id="why-us" className="relative overflow-hidden border-y border-slate-100 bg-slate-50/60 py-14 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-0 h-[320px] w-[320px] scale-150 glow-navy" />
        <div className="absolute bottom-0 right-[10%] h-[300px] w-[300px] scale-150 glow-orange" />
      </div>

      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Why VinGo</span>
          <h2 className="section-title mt-5">Built to be an easy supplier to work with</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Predictable quality, clear communication and paperwork that clears customs without drama.
          </p>
        </Reveal>

        {/* Phones: icon beside the text to keep six cards short. From sm up: icon on top. */}
        <div className="mt-8 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {whyChooseUs.map((item, i) => {
            const Icon = icons[item.icon] ?? ShieldCheck;
            return (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="group flex h-full gap-4 rounded-2xl border border-white/70 bg-white/75 p-4 transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1 hover:border-navy-200 hover:shadow-glass sm:block sm:p-6">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition-colors group-hover:bg-navy-600 group-hover:text-white sm:h-11 sm:w-11">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-ink-900 sm:mt-4 sm:text-lg">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500 sm:mt-2">{item.description}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
