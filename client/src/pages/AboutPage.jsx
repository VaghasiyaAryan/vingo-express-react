import SiteLayout from "@/components/SiteLayout.jsx";
import PageHeader from "@/components/PageHeader.jsx";
import About from "@/components/sections/About.jsx";
import WhyUs from "@/components/sections/WhyUs.jsx";
import Process from "@/components/sections/Process.jsx";
import GlobalReach from "@/components/sections/GlobalReach.jsx";
import QuoteCta from "@/components/sections/QuoteCta.jsx";
import { company } from "@shared/content.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function AboutPage() {
  useDocumentTitle("About Us");

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="About Us"
        title={`About ${company.shortName}`}
        subtitle="Who we are, how we work, and where we ship — the story behind every batch we export."
        crumb="About"
      />
      <About />
      <WhyUs />
      <Process />
      <GlobalReach />
      <QuoteCta />
    </SiteLayout>
  );
}
