import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, ChevronRight, Loader2 } from "lucide-react";

import Navbar from "@/components/sections/Navbar.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";
import Reveal from "@/components/Reveal.jsx";
import ProductVisual from "@/components/ProductVisual.jsx";
import ProductCtas from "@/components/ProductCtas.jsx";
import NotFound from "@/pages/NotFound.jsx";
import { quoteMailtoLink, quoteWhatsappLink } from "@shared/content.js";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

// Product and BreadcrumbList JSON-LD, the canonical link and the Open Graph
// tags are stamped into the HTML by server/src/seo/meta.js before this bundle
// ever runs — a crawler gets them without executing any JavaScript.

export default function Product() {
  const { slug } = useParams();
  const fetchProduct = useCallback((signal) => endpoints.product(slug, { signal }), [slug]);
  const { data, error, loading } = useApi(fetchProduct, [slug]);

  const product = data?.product;
  const related = data?.related ?? [];
  const category = data?.category;

  useDocumentTitle(product ? `${product.name} Supplier & Exporter from India` : null);

  // A slug that is not in the catalogue is a 404, not an error state — the
  // server already answered the original request with a 404 status.
  if (error?.status === 404) return <NotFound />;

  return (
    <>
      <Navbar />
      <main className="pt-28 sm:pt-32 lg:pt-36">
        <div className="container-x">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
            <Link to="/" className="hover:text-navy-700">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/#products" className="hover:text-navy-700">
              Products
            </Link>
            {product && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-ink-700">{product.name}</span>
              </>
            )}
          </nav>

          {loading && (
            <div className="flex min-h-[50vh] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading product" />
            </div>
          )}

          {error && error.status !== 404 && (
            <p className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error.message}
            </p>
          )}

          {product && (
            <>
              <Reveal className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
                <div className="overflow-hidden rounded-3xl">
                  <ProductVisual product={product} rounded="rounded-3xl" className="aspect-[4/3] w-full" priority />
                </div>

                <div>
                  {category && <span className="section-eyebrow">{category.title}</span>}
                  <h1 className="mt-4 font-display text-3xl font-bold text-ink-900 sm:text-4xl">{product.name}</h1>
                  <p className="mt-4 text-base leading-relaxed text-ink-500">{product.description}</p>

                  <ProductCtas
                    slug={product.slug}
                    name={product.name}
                    enquireHref={`/?product=${product.slug}#enquiry`}
                    whatsappHref={quoteWhatsappLink(product.name)}
                    mailtoHref={quoteMailtoLink(product.name)}
                  />
                </div>
              </Reveal>

              <Reveal delay={0.08} className="mt-14 grid gap-10 sm:grid-cols-2">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Available Forms</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {product.forms.map((f) => (
                      <li
                        key={f}
                        className="rounded-full border border-navy-100 bg-navy-50 px-3 py-1 text-xs font-medium text-navy-800"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>

                  <h2 className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Applications</h2>
                  <ul className="mt-3 space-y-1.5">
                    {product.applications.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-sm text-ink-700">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-navy-500" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Specifications</h2>
                  <dl className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                    {Object.entries(product.specs).map(([key, value], i) => (
                      <div
                        key={key}
                        className={`flex items-start justify-between gap-4 px-4 py-2.5 text-sm ${
                          i % 2 === 0 ? "bg-slate-50/70" : "bg-white"
                        }`}
                      >
                        <dt className="text-ink-500">{key}</dt>
                        <dd className="text-right font-medium text-ink-900">{value}</dd>
                      </div>
                    ))}
                    <div className="flex items-start justify-between gap-4 bg-slate-50/70 px-4 py-2.5 text-sm">
                      <dt className="text-ink-500">HS Code</dt>
                      <dd className="text-right font-medium text-ink-900">Contact us for applicable classification</dd>
                    </div>
                  </dl>
                  <p className="mt-2.5 text-[0.7rem] leading-relaxed text-ink-500">
                    Specifications are indicative and can be matched to your requirement. Custom cuts, mesh sizes and
                    packaging available on request.
                  </p>
                </div>
              </Reveal>

              {related.length > 0 && (
                <Reveal delay={0.12} className="mt-16 border-t border-slate-100 pt-12">
                  <h2 className="section-title text-2xl">Related products</h2>
                  <div className="mt-6 grid gap-5 sm:grid-cols-3">
                    {related.map((r) => (
                      <Link
                        key={r.slug}
                        to={`/products/${r.slug}`}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-glass transition-all duration-500 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lift"
                      >
                        <span className="block h-32 w-full overflow-hidden">
                          <ProductVisual product={r} rounded="rounded-none" />
                        </span>
                        <span className="flex items-center justify-between gap-2 p-4">
                          <span className="text-sm font-semibold text-ink-900">{r.name}</span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-navy-600 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </Reveal>
              )}
            </>
          )}
        </div>

        <div className="h-20" />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
