import SiteLayout from "@/components/SiteLayout.jsx";
import PageHeader from "@/components/PageHeader.jsx";
import Faq from "@/components/sections/Faq.jsx";
import QuoteCta from "@/components/sections/QuoteCta.jsx";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

// FAQPage JSON-LD is stamped into this page's HTML by server/src/seo/meta.js.

export default function FaqPage() {
  useDocumentTitle("Frequently Asked Questions");

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="FAQ"
        title="Frequently asked questions"
        subtitle="Samples, minimum orders, packaging, documentation and shipping — the answers buyers look for first."
        crumb="FAQ"
      />
      <Faq />
      <QuoteCta title="Didn't find your answer?" text="Ask us directly — we usually reply the same day." />
    </SiteLayout>
  );
}
