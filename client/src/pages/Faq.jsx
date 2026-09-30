import Navbar from "@/components/sections/Navbar.jsx";
import FaqSection from "@/components/sections/Faq.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";
import Breadcrumb from "@/components/Breadcrumb.jsx";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function Faq() {
  useDocumentTitle("FAQ");

  return (
    <>
      <Navbar />
      <main className="pt-28 sm:pt-32 lg:pt-36">
        <Breadcrumb trail={[{ label: "FAQ" }]} />
        <FaqSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
