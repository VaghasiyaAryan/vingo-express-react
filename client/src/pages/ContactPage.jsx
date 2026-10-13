import { useCallback } from "react";
import SiteLayout from "@/components/SiteLayout.jsx";
import PageHeader from "@/components/PageHeader.jsx";
import Enquiry from "@/components/sections/Enquiry.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

/**
 * The enquiry form. A product page links here as /contact?product=<slug>,
 * which the form uses to prefill itself — that needs the catalogue, so it is
 * fetched here too.
 */
export default function ContactPage() {
  useDocumentTitle("Contact Us");

  const fetchProducts = useCallback((signal) => endpoints.products({ signal }), []);
  const { data } = useApi(fetchProducts);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Contact"
        title="Contact us"
        subtitle="Request a quotation, ask for samples, or just say hello — by form, phone, email or WhatsApp."
        crumb="Contact"
      />
      <Enquiry products={data?.products ?? []} />
    </SiteLayout>
  );
}
