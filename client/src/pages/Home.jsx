import { useCallback } from "react";
import SiteLayout from "@/components/SiteLayout.jsx";
import Hero from "@/components/sections/Hero.jsx";
import About from "@/components/sections/About.jsx";
import Products from "@/components/sections/Products.jsx";
import WhyUs from "@/components/sections/WhyUs.jsx";
import QuoteCta from "@/components/sections/QuoteCta.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDefaultDocumentTitle } from "@/lib/useDocumentTitle.js";

// Organization JSON-LD lives in server/src/seo/meta.js — it is stamped into
// the HTML before it reaches the browser, so a crawler sees it whether or not
// it runs this bundle.

/**
 * A short tour of the site: each section here previews a page of its own
 * (About, Products) or leads to Contact.
 */
export default function Home() {
  useDefaultDocumentTitle();

  const fetchProducts = useCallback((signal) => endpoints.products({ signal }), []);
  const { data, error, loading } = useApi(fetchProducts);
  const products = data?.products ?? [];

  return (
    <SiteLayout>
      <Hero />
      <About moreLink />
      <Products products={products} loading={loading} error={error} variant="preview" />
      <WhyUs />
      <QuoteCta />
    </SiteLayout>
  );
}
