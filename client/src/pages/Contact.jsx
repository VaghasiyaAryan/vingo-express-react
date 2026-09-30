import { useCallback } from "react";
import Navbar from "@/components/sections/Navbar.jsx";
import Enquiry from "@/components/sections/Enquiry.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";
import Breadcrumb from "@/components/Breadcrumb.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function Contact() {
  useDocumentTitle("Contact Us");

  // Products are fetched so a visitor arriving from a product page
  // (/contact?product=<slug>) gets the enquiry form prefilled — see Enquiry.jsx.
  const fetchProducts = useCallback((signal) => endpoints.products({ signal }), []);
  const { data } = useApi(fetchProducts);
  const products = data?.products ?? [];

  return (
    <>
      <Navbar />
      <main className="pt-28 sm:pt-32 lg:pt-36">
        <Breadcrumb trail={[{ label: "Contact" }]} />
        <Enquiry products={products} />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
