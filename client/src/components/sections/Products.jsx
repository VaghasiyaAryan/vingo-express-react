import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Package, LayoutGrid, ChevronDown, ChevronUp, Mail } from "lucide-react";
import Reveal from "@/components/Reveal.jsx";
import ProductVisual from "@/components/ProductVisual.jsx";
import { productCategories, whatsappLink, quoteWhatsappLink, quoteMailtoLink } from "@shared/content.js";
import { WhatsAppIcon } from "@/components/WhatsAppButton.jsx";

const filters = [
  { slug: "all", title: "All Products" },
  ...productCategories.map((c) => ({ slug: c.slug, title: c.title })),
];

/** Products shown before the visitor expands the catalogue. */
const PREVIEW_COUNT = 3;

/** Placeholder card, shown while the catalogue is on its way from the API. */
function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-glass">
      <div className="h-44 w-full bg-slate-100" />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="h-5 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
        <div className="mt-4 h-9 w-full rounded-full bg-slate-50" />
      </div>
    </div>
  );
}

export default function Products({ products = [], loading = false, error = null }) {
  const [active, setActive] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const matching = active === "all" ? products : products.filter((p) => p.category === active);
  const visible = showAll ? matching : matching.slice(0, PREVIEW_COUNT);
  const hidden = matching.length - visible.length;

  function chooseFilter(slug) {
    setActive(slug);
    setShowAll(false); // each category starts collapsed again
  }

  return (
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
            Browse our dehydrated range by category. Every product is supplied to your cut size, mesh and packaging
            specification — tap any item for full details.
          </p>
        </Reveal>

        {/* Category filters */}
        <Reveal delay={0.08}>
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {filters.map((f) => {
              const isActive = active === f.slug;
              return (
                <button
                  key={f.slug}
                  type="button"
                  onClick={() => chooseFilter(f.slug)}
                  aria-pressed={isActive}
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold backdrop-blur-md backdrop-saturate-150 transition-all duration-300 ${
                    isActive
                      ? "border-white/40 bg-gradient-to-r from-orange-500/90 to-orange-600/90 text-white shadow-lift"
                      : "border-white/60 bg-white/50 text-ink-700 hover:border-navy-300 hover:bg-white/70 hover:text-navy-700"
                  }`}
                >
                  {f.title}
                </button>
              );
            })}
          </div>
        </Reveal>

        {error && (
          <p className="mt-12 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-700">
            {error.message} Please refresh the page — or message us on WhatsApp and we will send the catalogue over.
          </p>
        )}

        {/* Product grid */}
        {/* Keying the grid on `active` remounts it per filter — the filtered set is
            always exactly what renders, and cards animate in fresh. */}
        <div key={`${active}-${showAll}`} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && products.length === 0 && !error
            ? Array.from({ length: PREVIEW_COUNT }, (_, i) => <ProductCardSkeleton key={i} />)
            : null}
          {visible.map((product, i) => (
            <motion.article
              key={product.slug}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.32), ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-glass transition-all duration-500 hover:-translate-y-1.5 hover:border-navy-200 hover:shadow-lift"
            >
                <Link
                  to={`/products/${product.slug}`}
                  className="block h-44 w-full overflow-hidden"
                  aria-label={`View details for ${product.name}`}
                >
                  <span className="block h-full w-full transition-transform duration-700 group-hover:scale-105">
                    <ProductVisual product={product} rounded="rounded-none" />
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-lg font-bold text-ink-900">{product.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">{product.short}</p>

                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {product.forms.slice(0, 3).map((f) => (
                      <li
                        key={f}
                        className="rounded-full border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[0.7rem] font-medium text-ink-700"
                      >
                        {f}
                      </li>
                    ))}
                    {product.forms.length > 3 && (
                      <li className="rounded-full px-1 py-1 text-[0.7rem] font-medium text-ink-500">
                        +{product.forms.length - 3}
                      </li>
                    )}
                  </ul>

                  <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <Link
                      to={`/products/${product.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 transition-all hover:gap-2.5"
                    >
                      View details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <div className="ml-auto flex items-center gap-1.5">
                      <a
                        href={quoteWhatsappLink(product.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Request a quotation for ${product.name} on WhatsApp`}
                        title="Contact on WhatsApp"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#25D366]/30 bg-[#25D366]/10 text-[#128C4A] transition-colors hover:bg-[#25D366]/20"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </a>
                      <a
                        href={quoteMailtoLink(product.name)}
                        aria-label={`Request a quotation for ${product.name} by email`}
                        title="Email for a quotation"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-200 bg-navy-50 text-navy-700 transition-colors hover:bg-navy-100"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
            </motion.article>
          ))}
        </div>

        {/* Expand / collapse the rest of the catalogue */}
        {matching.length > PREVIEW_COUNT && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <button type="button" onClick={() => setShowAll((v) => !v)} className="btn-ghost">
              {showAll ? (
                <>
                  Show fewer products
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  View all {matching.length} products
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
            {!showAll && (
              <p className="text-xs text-ink-500">
                {hidden} more {hidden === 1 ? "product" : "products"} in this range
              </p>
            )}
          </div>
        )}

        {/* Custom requirement CTA */}
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-navy-700 to-navy-900 p-8 text-white shadow-liftNavy sm:flex-row sm:p-10">
            <Package className="h-10 w-10 shrink-0 text-orange-300" />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-display text-xl font-bold sm:text-2xl">
                Need a product or cut size not listed here?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-100">
                We regularly develop new products against buyer specifications. Send your requirement and we will
                confirm feasibility, pricing and sample timelines.
              </p>
            </div>
            <a
              href={whatsappLink(
                "Hello VinGo International, I am looking for a specific dehydrated product. Can you help?"
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn shrink-0 border border-white/50 bg-white/80 text-navy-800 backdrop-blur-md backdrop-saturate-150 hover:bg-white"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Discuss on WhatsApp
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
