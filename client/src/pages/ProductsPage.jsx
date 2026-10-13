import { useCallback } from "react";
import SiteLayout from "@/components/SiteLayout.jsx";
import PageHeader from "@/components/PageHeader.jsx";
import Products from "@/components/sections/Products.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function ProductsPage() {
  useDocumentTitle("Products");

  const fetchProducts = useCallback((signal) => endpoints.products({ signal }), []);
  const { data, error, loading } = useApi(fetchProducts);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Our Products"
        title="A catalogue built for your production line"
        subtitle="Browse our dehydrated range by category. Every product is supplied to your cut size, mesh and packaging specification — tap any item for full details."
        crumb="Products"
      />
      <Products products={data?.products ?? []} loading={loading} error={error} intro={false} />
    </SiteLayout>
  );
}
