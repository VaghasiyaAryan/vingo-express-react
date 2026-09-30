import Navbar from "@/components/sections/Navbar.jsx";
import ProcessSection from "@/components/sections/Process.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";
import Breadcrumb from "@/components/Breadcrumb.jsx";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function Process() {
  useDocumentTitle("Our Process");

  return (
    <>
      <Navbar />
      <main className="pt-28 sm:pt-32 lg:pt-36">
        <Breadcrumb trail={[{ label: "Process" }]} />
        <ProcessSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
