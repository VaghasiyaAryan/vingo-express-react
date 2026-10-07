import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ProductForm, { formStateFrom, payloadFrom } from "./ProductForm.jsx";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

/** Both halves of product editing — /admin/products/new and .../:id/edit. */
export default function ProductEditor({ mode }) {
  const isEdit = mode === "edit";
  const { id } = useParams();
  const navigate = useNavigate();

  useDocumentTitle(isEdit ? "Edit Product" : "Add Product");

  const fetchProduct = useCallback((signal) => endpoints.admin.product(id, { signal }), [id]);
  // The create form has nothing to load, so the fetch is skipped entirely.
  const { data, error: loadError, loading } = useApi(
    isEdit ? fetchProduct : async () => null,
    [isEdit, id]
  );

  const [saveError, setSaveError] = useState(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(state) {
    setPending(true);
    setSaveError(null);
    try {
      const payload = payloadFrom(state);
      if (isEdit) {
        await endpoints.admin.updateProduct(id, payload);
        navigate("/admin/products", { state: { toast: "updated" } });
      } else {
        await endpoints.admin.createProduct(payload);
        navigate("/admin/products", { state: { toast: "created" } });
      }
    } catch (err) {
      setSaveError(err.message);
      setPending(false);
    }
  }

  if (isEdit && loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading product" />
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="container-x py-10">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loadError.message}
        </p>
      </div>
    );
  }

  const product = data?.product;

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">{isEdit ? "Edit Product" : "Add Product"}</h1>
      <p className="mt-2 text-sm text-ink-500">
        {isEdit
          ? product?.name
          : "New products are visible on the public site immediately unless you uncheck “Visible.”"}
      </p>

      <ProductForm
        initialState={formStateFrom(product)}
        error={saveError}
        pending={pending}
        submitLabel={isEdit ? "Save Changes" : "Create Product"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
