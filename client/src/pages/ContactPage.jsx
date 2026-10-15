import { useCallback } from "react";
import SiteLayout from "@/components/SiteLayout.jsx";
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
      {/* The enquiry section opens the page itself (breadcrumb + the single <h1>). */}
      <Enquiry products={data?.products ?? []} page />
    </SiteLayout>
  );
}
