import { m } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Package, LayoutGrid, Mail } from "lucide-react";
import Reveal from "@/components/Reveal.jsx";
import ProductVisual from "@/components/ProductVisual.jsx";
import { productCategories, whatsappLink, quoteWhatsappLink, quoteMailtoLink } from "@shared/content.js";
import { WhatsAppIcon } from "@/components/WhatsAppButton.jsx";

const filters = [
  { slug: "all", title: "All Products" },
  ...productCategories.map((c) => ({ slug: c.slug, title: c.title })),
];

/** Products shown in the homepage preview. */
const PREVIEW_COUNT = 3;

/** Cards that fade in; the rest (below the fold anyway) appear instantly. */
const ANIMATED_CARDS = 6;

/** Placeholder card, shown while the catalogue is on its way from the API. */
function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-glass sm:flex-col sm:rounded-3xl">
      <div className="w-24 shrink-0 bg-slate-100 min-[380px]:w-28 sm:h-44 sm:w-full" />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
        <div className="h-5 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
        <div className="mt-4 h-9 w-full rounded-full bg-slate-50" />
      </div>
    </div>
  );
}

/**
 * `variant="preview"` (homepage): the first few products and a link to the
 * full catalogue. `variant="full"` (/products): every product, with category
 * filters kept in the URL (?category=…) so a filtered view can be linked to —
 * the footer's category links rely on that.
 */
export default function Products({ products = [], loading = false, error = null, variant = "full", intro = true }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreview = variant === "preview";

  const requested = searchParams.get("category");
  const active = !isPreview && filters.some((f) => f.slug === requested) ? requested : "all";

  const matching = active === "all" ? products : products.filter((p) => p.category === active);
  const visible = isPreview ? matching.slice(0, PREVIEW_COUNT) : matching;

  function chooseFilter(slug) {
    setSearchParams(slug === "all" ? {} : { category: slug }, { replace: true, preventScrollReset: true });
  }

  return (
    <section
      id="products"
      className={`relative overflow-hidden ${intro ? "py-14 sm:py-20 lg:py-28" : "pt-2 pb-14 sm:pt-4 sm:pb-20 lg:pb-28"}`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-navy-50/60 via-white to-white" />

      <div className="container-x">
        {intro && (
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
        )}

        {/* Category filters */}
        {!isPreview && (
          <Reveal delay={0.08}>
            {/* One swipeable row on phones instead of four rows of wrapped pills. */}
            <div
              className={`${intro ? "mt-8 sm:mt-10" : ""} -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-2.5 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden`}
            >
              {filters.map((f) => {
                const isActive = active === f.slug;
                return (
                  <button
                    key={f.slug}
                    type="button"
                    onClick={() => chooseFilter(f.slug)}
                    aria-pressed={isActive}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-[color,background-color,border-color,box-shadow] duration-300 sm:px-5 sm:py-2.5 ${
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
        )}

        {error && (
          <p className="mt-12 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-700">
            {error.message} Please refresh the page — or message us on WhatsApp and we will send the catalogue over.
          </p>
        )}

        {/* Product grid */}
        {/* Keying the grid on `active` remounts it per filter — the filtered set is
            always exactly what renders, and cards animate in fresh. On phones each
            card is a compact row (photo left, text right); from sm up, a full card. */}
        <div key={active} className="mt-6 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {loading && products.length === 0 && !error
            ? Array.from({ length: PREVIEW_COUNT }, (_, i) => <ProductCardSkeleton key={i} />)
            : null}
          {/* The entrance animation lives on a wrapper, the hover lift on the card:
              framer-motion leaves an inline transform on whatever it animates,
              which used to override the card's hover lift. Only the first few
              cards animate in — animating all 25 at once froze slow phones. */}
          {visible.map((product, i) => (
            <m.div
              key={product.slug}
              initial={i < ANIMATED_CARDS ? { opacity: 0, y: 18 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="flex"
            >
              <article className="group flex w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-glass transition-[transform,box-shadow,border-color] duration-500 ease-out hover:-translate-y-1.5 hover:border-navy-200 hover:shadow-lift sm:flex-col sm:rounded-3xl">
                <Link
                  to={`/products/${product.slug}`}
                  className="block w-24 shrink-0 overflow-hidden min-[380px]:w-28 sm:h-44 sm:w-full"
                  aria-label={`View details for ${product.name}`}
                >
                  <span className="block h-full w-full transition-transform duration-700 group-hover:scale-105">
                    <ProductVisual product={product} rounded="rounded-none" />
                  </span>
                </Link>

                <div className="flex min-w-0 flex-1 flex-col p-3 min-[380px]:p-4 sm:p-6">
                  <h3 className="font-display text-base font-bold text-ink-900 sm:text-lg">{product.name}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-500 sm:mt-2 sm:line-clamp-none sm:text-sm">
                    {product.short}
                  </p>

                  <ul className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
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

                  <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 sm:mt-5 sm:pt-4">
                    <Link
                      to={`/products/${product.slug}`}
                      className="group/details inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-navy-700 sm:gap-1.5 sm:text-sm"
                    >
                      {/* "Details" on the narrowest phones, where the full label would push the buttons out. */}
                      <span className="min-[380px]:hidden">Details</span>
                      <span className="hidden min-[380px]:inline">View details</span>
                      {/* Nudge the arrow with a transform rather than growing the gap,
                          which re-laid-out the whole row on every hover frame. */}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/details:translate-x-1 sm:h-4 sm:w-4" />
                    </Link>
                    <div className="ml-auto flex shrink-0 items-center gap-1.5">
                      <a
                        href={quoteWhatsappLink(product.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Request a quotation for ${product.name} on WhatsApp`}
                        title="Contact on WhatsApp"
                        className="flex h-8 w-8 items-center justify-center rounded-full border sm:h-9 sm:w-9 border-[#25D366]/30 bg-[#25D366]/10 text-[#128C4A] transition-colors hover:bg-[#25D366]/20"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </a>
                      <a
                        href={quoteMailtoLink(product.name)}
                        aria-label={`Request a quotation for ${product.name} by email`}
                        title="Email for a quotation"
                        className="flex h-8 w-8 items-center justify-center rounded-full border sm:h-9 sm:w-9 border-navy-200 bg-navy-50 text-navy-700 transition-colors hover:bg-navy-100"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            </m.div>
          ))}
        </div>

        {!isPreview && !loading && !error && matching.length === 0 && (
          <p className="mt-4 text-center text-sm text-ink-500">
            No products in this category yet — message us and we will tell you what we can supply.
          </p>
        )}

        {/* The homepage shows a taste; the full catalogue is its own page. */}
        {isPreview && (
          <div className="mt-10 flex justify-center">
            <Link to="/products" className="btn-ghost">
              {products.length > 0 ? `View all ${products.length} products` : "View all products"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Custom requirement CTA */}
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-br from-navy-700 to-navy-900 p-6 text-white shadow-liftNavy sm:flex-row sm:gap-6 sm:p-10">
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
              className="btn shrink-0 border border-white/50 bg-white/80 text-navy-800 hover:bg-white"
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
