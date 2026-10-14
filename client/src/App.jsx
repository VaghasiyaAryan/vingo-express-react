import { Suspense, lazy, useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import ScrollBehaviour from "./components/ScrollBehaviour.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";

/**
 * Every page except the homepage (the most common landing page) and the 404
 * ships as its own chunk, so a visitor downloads the code for the page they
 * are on, not the whole site. The enquiry form's 170-country picker, the
 * product page and the legal pages no longer weigh down the first load.
 */
const pageImports = {
  about: () => import("./pages/AboutPage.jsx"),
  products: () => import("./pages/ProductsPage.jsx"),
  product: () => import("./pages/Product.jsx"),
  faq: () => import("./pages/FaqPage.jsx"),
  contact: () => import("./pages/ContactPage.jsx"),
};

const AboutPage = lazy(pageImports.about);
const ProductsPage = lazy(pageImports.products);
const Product = lazy(pageImports.product);
const FaqPage = lazy(pageImports.faq);
const ContactPage = lazy(pageImports.contact);
const BusinessCard = lazy(() => import("./pages/BusinessCard.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy.jsx"));
const Terms = lazy(() => import("./pages/legal/Terms.jsx"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy.jsx"));

// The admin dashboard is a whole second application that no site visitor ever
// loads. Splitting it out keeps it out of the public bundle entirely.
const AdminRoutes = lazy(() => import("./admin/AdminRoutes.jsx"));

/**
 * Once the first page is up and the browser is idle, fetch the main pages'
 * chunks in the background — so clicking About, Products, FAQ or Contact is
 * instant instead of waiting on a download.
 */
function usePrefetchPages() {
  useEffect(() => {
    const prefetch = () => Object.values(pageImports).forEach((load) => load().catch(() => {}));
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(prefetch, 2500);
    return () => clearTimeout(t);
  }, []);
}

/** While a page chunk loads: a blank screen the size of a page, so nothing jumps. */
function PageFallback() {
  return <div className="min-h-screen bg-white" />;
}

export default function App() {
  usePrefetchPages();

  return (
    <>
      <ScrollBehaviour />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<Product />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/card" element={<BusinessCard />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<Terms />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
                <AdminRoutes />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
