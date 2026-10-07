import { useCallback } from "react";
import Navbar from "@/components/sections/Navbar.jsx";
import Hero from "@/components/sections/Hero.jsx";
import About from "@/components/sections/About.jsx";
import Products from "@/components/sections/Products.jsx";
import WhyUs from "@/components/sections/WhyUs.jsx";
import Process from "@/components/sections/Process.jsx";
import GlobalReach from "@/components/sections/GlobalReach.jsx";
import Faq from "@/components/sections/Faq.jsx";
import Enquiry from "@/components/sections/Enquiry.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDefaultDocumentTitle } from "@/lib/useDocumentTitle.js";

// Organization and FAQPage JSON-LD live in server/src/seo/meta.js — they are
// stamped into the HTML before it reaches the browser, so a crawler sees them
// whether or not it runs this bundle.

export default function Home() {
  useDefaultDocumentTitle();

  const fetchProducts = useCallback((signal) => endpoints.products({ signal }), []);
  const { data, error, loading } = useApi(fetchProducts);
  const products = data?.products ?? [];

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Products products={products} loading={loading} error={error} />
        <WhyUs />
        <Process />
        <GlobalReach />
        <Faq />
        <Enquiry products={products} />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
