import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/sections/Navbar.jsx";
import ProductsSection from "@/components/sections/Products.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";
import Breadcrumb from "@/components/Breadcrumb.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function Products() {
  useDocumentTitle("Products");

  const [searchParams] = useSearchParams();
  const fetchProducts = useCallback((signal) => endpoints.products({ signal }), []);
  const { data, error, loading } = useApi(fetchProducts);
  const products = data?.products ?? [];

  return (
    <>
      <Navbar />
      <main className="pt-28 sm:pt-32 lg:pt-36">
        <Breadcrumb trail={[{ label: "Products" }]} />
        <ProductsSection
          products={products}
          loading={loading}
          error={error}
          initialCategory={searchParams.get("category")}
        />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
