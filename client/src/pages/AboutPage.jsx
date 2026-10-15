import SiteLayout from "@/components/SiteLayout.jsx";
import About from "@/components/sections/About.jsx";
import WhyUs from "@/components/sections/WhyUs.jsx";
import Process from "@/components/sections/Process.jsx";
import GlobalReach from "@/components/sections/GlobalReach.jsx";
import QuoteCta from "@/components/sections/QuoteCta.jsx";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

/**
 * One continuous page: the About section opens it (breadcrumb and the page's
 * single <h1>), followed by why buyers choose us, the process and our markets.
 */
export default function AboutPage() {
  useDocumentTitle("About Us");

  return (
    <SiteLayout>
      <About page />
      <WhyUs />
      <Process />
      <GlobalReach />
      <QuoteCta />
    </SiteLayout>
  );
}
