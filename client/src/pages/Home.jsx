import { useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, LayoutGrid, ShieldCheck, Globe2, Leaf, Quote, Download, Mail, FileCheck2 } from "lucide-react";
import Navbar from "@/components/sections/Navbar.jsx";
import Hero from "@/components/sections/Hero.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";
import Reveal from "@/components/Reveal.jsx";
import TeamPortrait from "@/components/TeamPortrait.jsx";
import ProductVisual from "@/components/ProductVisual.jsx";
import { WhatsAppIcon } from "@/components/WhatsAppButton.jsx";
import {
  about,
  productCategories,
  whyChooseUs,
  processSteps,
  testimonials,
  faqs,
  whatsappLink,
  quoteWhatsappLink,
  quoteMailtoLink,
} from "@shared/content.js";
import { countryNames } from "@shared/countries.js";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { analytics } from "@/lib/analytics.js";
import { useDefaultDocumentTitle } from "@/lib/useDocumentTitle.js";

// The three cards shown here mirror the first three entries of whyChooseUs —
// same icon set as the full grid on /why-us.
const previewWhyIcons = [ShieldCheck, Globe2, Leaf];

export default function Home() {
  useDefaultDocumentTitle();

  const fetchTeam = useCallback((signal) => endpoints.team({ signal }), []);
  const { data: teamData } = useApi(fetchTeam);
  const team = teamData?.team ?? [];

  // The public order is exactly what the admin controls from
  // /admin/products (its "Reorder products" drag view) — so which products
  // get featured here is a direct, deliberate choice, not arbitrary.
  const fetchProducts = useCallback((signal) => endpoints.products({ signal }), []);
  const { data: productsData } = useApi(fetchProducts);
  const featuredProducts = (productsData?.products ?? []).slice(0, 3);

  return (
    <>
      <Navbar />
      <main>
        <Hero />

        {/* About — teaser */}
        <section id="about" className="relative border-y border-slate-100 bg-white py-20 lg:py-28">
          <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <span className="section-eyebrow">About Us</span>
              <h2 className="section-title mt-5">{about.title}</h2>
              <p className="mt-6 text-base leading-relaxed text-ink-500">{about.paragraphs[0]}</p>
              <Link to="/about" className="btn-ghost mt-8">
                Read our full story
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>

            <Reveal delay={0.12}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {about.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-ink-700 shadow-glass"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-700">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* Products — category preview */}
        <section id="products" className="relative overflow-hidden py-20 lg:py-28">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-navy-50/60 via-white to-white" />
          <div className="container-x">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="section-eyebrow">
                <LayoutGrid className="h-3.5 w-3.5" />
                Our Products
              </span>
              <h2 className="section-title mt-5">A catalogue built for your production line</h2>
              <p className="mt-5 text-base leading-relaxed text-ink-500">
                Browse our dehydrated range by category. Every product is supplied to your cut size, mesh and
                packaging specification — tap any item for full details.
              </p>
              <a
                href="/api/catalog"
                download
                onClick={() => analytics.catalogDownload("home")}
                className="btn-ghost mt-6"
              >
                <Download className="h-4 w-4" />
                Download Full Catalogue (PDF)
              </a>
            </Reveal>

            {featuredProducts.length > 0 && (
              <>
                <Reveal delay={0.05}>
                  <p className="mt-14 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                    Featured products
                  </p>
                </Reveal>
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.map((product, i) => (
                  <motion.article
                    key={product.slug}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-glass transition-all duration-500 ease-smooth hover:-translate-y-1.5 hover:border-navy-200 hover:shadow-lift"
                  >
                    <Link
                      to={`/products/${product.slug}`}
                      className="block h-44 w-full overflow-hidden"
                      aria-label={`View details for ${product.name}`}
                    >
                      <span className="block h-full w-full transition-transform duration-700 ease-smooth group-hover:scale-105">
                        <ProductVisual product={product} rounded="rounded-none" />
                      </span>
                    </Link>

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-lg font-bold text-ink-900">{product.name}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{product.short}</p>

                      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                        <Link
                          to={`/products/${product.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 transition-all duration-300 ease-smooth hover:gap-2.5"
                        >
                          View details
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <div className="ml-auto flex items-center gap-1.5">
                          {product.coaUrl && (
                            <a
                              href={product.coaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => analytics.coaDownload(product.slug)}
                              aria-label={`Download Certificate of Analysis for ${product.name}`}
                              title="Download Certificate of Analysis (COA)"
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 bg-navy-50 text-navy-700 transition-all duration-300 ease-smooth hover:scale-110 hover:bg-navy-100"
                            >
                              <FileCheck2 className="h-4 w-4" />
                            </a>
                          )}
                          <a
                            href={quoteWhatsappLink(product.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Request a quotation for ${product.name} on WhatsApp`}
                            title="Contact on WhatsApp"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#25D366]/30 bg-[#25D366]/10 text-[#128C4A] transition-all duration-300 ease-smooth hover:scale-110 hover:bg-[#25D366]/20"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </a>
                          <a
                            href={quoteMailtoLink(product.name)}
                            aria-label={`Request a quotation for ${product.name} by email`}
                            title="Email for a quotation"
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 bg-navy-50 text-navy-700 transition-all duration-300 ease-smooth hover:scale-110 hover:bg-navy-100"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
                </div>
                <div className="mt-8 flex justify-center">
                  <Link to="/products" className="btn-ghost">
                    View All Products
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            )}

            <Reveal delay={0.05}>
              <p className="mt-14 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
                Browse by category
              </p>
            </Reveal>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {productCategories.map((cat, i) => (
                <Reveal key={cat.slug} delay={Math.min(i * 0.06, 0.24)}>
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="group flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-7 shadow-glass transition-all duration-500 ease-smooth hover:-translate-y-1.5 hover:border-navy-200 hover:shadow-lift"
                  >
                    <h3 className="font-display text-lg font-bold text-ink-900">{cat.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{cat.description}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 border-t border-slate-100 pt-4 text-sm font-semibold text-navy-700 transition-all duration-300 ease-smooth group-hover:gap-2.5">
                      View products
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Reveal>
              ))}

              <Reveal delay={0.3}>
                <Link
                  to="/products"
                  className="group flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br from-navy-700 to-navy-900 p-7 text-white shadow-liftNavy transition-all duration-500 ease-smooth hover:-translate-y-1.5"
                >
                  <div>
                    <h3 className="font-display text-lg font-bold">Browse All Products</h3>
                    <p className="mt-2 text-sm leading-relaxed text-navy-100">
                      Every product across all categories, with forms, cut sizes and packaging options.
                    </p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 border-t border-white/15 pt-4 text-sm font-semibold text-orange-300 transition-all duration-300 ease-smooth group-hover:gap-2.5">
                    Browse all products
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Why Us — preview */}
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

            <div className="mt-14 grid gap-5 sm:grid-cols-3">
              {whyChooseUs.slice(0, 3).map((item, i) => {
                const Icon = previewWhyIcons[i] ?? ShieldCheck;
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

            <div className="mt-10 flex justify-center">
              <Link to="/why-us" className="btn-ghost">
                See all reasons to choose us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Process — compact preview */}
        <section id="process" className="relative overflow-hidden py-20 lg:py-28">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh-light opacity-60" />

          <div className="container-x">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="section-eyebrow">Our Process</span>
              <h2 className="section-title mt-5">From farm to your port, in six steps</h2>
            </Reveal>

            <Reveal delay={0.1}>
              <ol className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {processSteps.map((step) => (
                  <li
                    key={step.step}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-glass"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-navy-600 to-navy-800 font-display text-sm font-bold text-white shadow-liftNavy">
                      {step.step}
                    </span>
                    <span className="text-sm font-semibold text-ink-900">{step.title}</span>
                  </li>
                ))}
              </ol>
            </Reveal>

            <div className="mt-10 flex justify-center">
              <Link to="/process" className="btn-ghost">
                See the full process
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Global Reach — markets marquee + one testimonial */}
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
            <div
              // Pausing on hover stops the strip while a visitor is reading it —
              // without this, each pill slides out from under the pointer
              // mid-hover, which reads as the strip stuttering or getting stuck.
              //
              // The full country list only needs duplicating once (not
              // repeated per-name) to make the CSS loop seamless — the second
              // copy is what's scrolling into view as the first copy scrolls
              // out, so the strip never visibly "resets". At this length a
              // full pass takes minutes, so in practice a visitor just sees a
              // slow, continuous drift through every country, never a repeat.
              className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused] [animation-duration:280s]"
            >
              {[...countryNames, ...countryNames].map((market, i) => (
                <span
                  key={`${market}-${i}`}
                  className="whitespace-nowrap rounded-full border border-navy-100 bg-navy-50/70 px-5 py-2.5 text-sm font-semibold text-navy-800"
                >
                  {market}
                </span>
              ))}
            </div>
          </div>

          {testimonials[0] && (
            <div className="container-x mt-16">
              <Reveal className="mx-auto max-w-2xl">
                <figure className="card text-center">
                  <Quote className="mx-auto h-7 w-7 text-navy-200" />
                  <blockquote className="mt-4 text-sm leading-relaxed text-ink-700">
                    {testimonials[0].quote}
                  </blockquote>
                  <figcaption className="mt-6 border-t border-slate-100 pt-4">
                    <span className="block text-sm font-semibold text-ink-900">{testimonials[0].name}</span>
                    <span className="block text-xs text-ink-500">{testimonials[0].role}</span>
                  </figcaption>
                </figure>
              </Reveal>
              <div className="mt-8 flex justify-center">
                <Link to="/global-reach" className="btn-ghost">
                  Read more from our buyers
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Team — preview */}
        {team.length > 0 && (
        <section id="team" className="relative overflow-hidden bg-white py-20 lg:py-28">
          <div className="container-x">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="section-eyebrow">Our Team</span>
              <h2 className="section-title mt-5">The people your order actually passes through</h2>
              <p className="mt-5 text-base leading-relaxed text-ink-500">
                Every enquiry reaches a named person, not a shared inbox — the people who quote it, source and check
                the batch behind it, and prepare the documents that travel with it.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {team.map((member, i) => (
                <Reveal key={member.id} delay={i * 0.06}>
                  <div className="h-full rounded-2xl border border-white/60 bg-white/50 p-6 text-center backdrop-blur-xl backdrop-saturate-150 transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-navy-200 hover:shadow-glass">
                    <span className="mx-auto block h-16 w-16 overflow-hidden rounded-full shadow-glass">
                      <TeamPortrait name={member.name} photo={member.photo} textSize="text-base" iconSize="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 font-display text-sm font-bold text-ink-900">{member.name}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
                      {member.role}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link to="/team" className="btn-ghost">
                Meet the full team
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
        )}

        {/* FAQ — preview */}
        <section id="faq" className="py-20 lg:py-28">
          <div className="container-x">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="section-eyebrow">FAQ</span>
              <h2 className="section-title mt-5">Questions buyers ask us first</h2>
            </Reveal>

            <Reveal delay={0.1} className="mx-auto mt-12 max-w-3xl">
              <dl className="divide-y divide-slate-200 border-y border-slate-200">
                {faqs.slice(0, 3).map((faq) => (
                  <div key={faq.q} className="py-5">
                    <dt className="font-display text-base font-bold text-ink-900 sm:text-lg">{faq.q}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-ink-500">{faq.a}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex justify-center">
                <Link to="/faq" className="btn-ghost">
                  View all FAQs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 lg:py-24">
          <div className="container-x">
            <Reveal className="flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-navy-700 to-navy-900 p-8 text-center text-white shadow-liftNavy sm:p-12">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready to request a quotation?</h2>
              <p className="max-w-xl text-sm leading-relaxed text-navy-100 sm:text-base">
                Share your product, quantity and destination port. We will come back with pricing, specifications
                and sample options — usually within one working day.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="btn shrink-0 border border-white/50 bg-white/90 text-navy-800 backdrop-blur-md backdrop-saturate-150 hover:bg-white"
                >
                  Request a Quotation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn shrink-0 border border-[#25D366]/40 bg-[#25D366]/90 text-white backdrop-blur-md backdrop-saturate-150 hover:brightness-95"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Chat on WhatsApp
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
