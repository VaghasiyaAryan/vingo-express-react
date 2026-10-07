import Reveal from "@/components/Reveal.jsx";
import { processSteps } from "@shared/content.js";

export default function Process() {
  return (
    <section id="process" className="relative overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh-light opacity-60" />

      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Our Process</span>
          <h2 className="section-title mt-5">From farm to your port, in six steps</h2>
        </Reveal>

        <div className="relative mt-16">
          <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-navy-200 via-navy-300 to-transparent lg:left-0 lg:top-7 lg:h-px lg:w-full lg:bg-gradient-to-r lg:from-navy-200 lg:via-navy-300 lg:to-navy-100" />

          <ol className="grid gap-8 lg:grid-cols-6 lg:gap-4">
            {processSteps.map((step, i) => (
              <Reveal key={step.step} delay={i * 0.08}>
                <li className="relative flex gap-5 lg:flex-col lg:gap-0">
                  <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-navy-600 to-navy-800 font-display text-sm font-bold text-white shadow-liftNavy lg:h-14 lg:w-14">
                    {step.step}
                  </span>
                  <div className="lg:mt-5 lg:pr-3">
                    <h3 className="font-display text-lg font-bold text-ink-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.description}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
