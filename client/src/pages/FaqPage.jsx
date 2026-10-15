import SiteLayout from "@/components/SiteLayout.jsx";
import Faq from "@/components/sections/Faq.jsx";
import QuoteCta from "@/components/sections/QuoteCta.jsx";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

// FAQPage JSON-LD is stamped into this page's HTML by server/src/seo/meta.js.

/** One continuous page: the FAQ section opens it, with the page's single <h1>. */
export default function FaqPage() {
  useDocumentTitle("Frequently Asked Questions");

  return (
    <SiteLayout>
      <Faq page />
      <QuoteCta title="Didn't find your answer?" text="Ask us directly — we usually reply the same day." />
    </SiteLayout>
  );
}
