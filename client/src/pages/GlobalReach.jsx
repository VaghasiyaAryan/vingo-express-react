import Navbar from "@/components/sections/Navbar.jsx";
import GlobalReachSection from "@/components/sections/GlobalReach.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";
import Breadcrumb from "@/components/Breadcrumb.jsx";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function GlobalReach() {
  useDocumentTitle("Global Reach");

  return (
    <>
      <Navbar />
      <main className="pt-28 sm:pt-32 lg:pt-36">
        <Breadcrumb trail={[{ label: "Global Reach" }]} />
        <GlobalReachSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
