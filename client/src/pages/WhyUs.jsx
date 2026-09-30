import Navbar from "@/components/sections/Navbar.jsx";
import WhyUsSection from "@/components/sections/WhyUs.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";
import Breadcrumb from "@/components/Breadcrumb.jsx";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function WhyUs() {
  useDocumentTitle("Why Choose Us");

  return (
    <>
      <Navbar />
      <main className="pt-28 sm:pt-32 lg:pt-36">
        <Breadcrumb trail={[{ label: "Why Us" }]} />
        <WhyUsSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
