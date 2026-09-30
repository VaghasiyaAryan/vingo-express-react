import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, Pencil, Loader2, FileCheck2, Search, ArrowUpDown } from "lucide-react";
import ProductVisual from "@/components/ProductVisual.jsx";
import { productCategories } from "@shared/content.js";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useToast } from "./Toast.jsx";
import ProductActions from "./ProductActions.jsx";
import ProductMoveButtons from "./ProductMoveButtons.jsx";
import ProductReorderPanel from "./ProductReorderPanel.jsx";

const TOAST_MESSAGES = {
  created: "Product created.",
  updated: "Product changes saved.",
};

function categoryTitle(slug) {
  return productCategories.find((c) => c.slug === slug)?.title || slug;
}

export default function ProductsList() {
  useDocumentTitle("Products");

  const fetchProducts = useCallback((signal) => endpoints.admin.products({ signal }), []);
  const { data, error, loading, mutate, reload } = useApi(fetchProducts);
  const products = data?.products ?? [];

  // Client-side, not server-side — the admin already fetches every product
  // in one shot (there's no pagination), so a round trip for this would just
  // be slower for no benefit.
  const [search, setSearch] = useState("");
  const [reordering, setReordering] = useState(false);
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || categoryTitle(p.category).toLowerCase().includes(q)
    );
  }, [products, search]);

  // Reordering swaps sortOrder with whatever's globally adjacent, so a full
  // reload (rather than a local patch) is what correctly reflects it — the
  // list's overall order depends on more than just the two rows involved.
  const handleMoved = useCallback(async () => {
    reload();
  }, [reload]);

  // The table itself stays grouped by visibility/COA for scanning (see the
  // admin route's orderBy), which is not the same as public order — so each
  // row's actual rank in that public order (1 = first on the site) is shown
  // next to its move buttons, and is also what marks the very first/last
  // product overall so those buttons disable correctly.
  const { rankById, firstId, lastId } = useMemo(() => {
    const bySortOrder = [...products].sort((a, b) => a.sortOrder - b.sortOrder);
    const rankById = new Map(bySortOrder.map((p, i) => [p.id, i + 1]));
    return {
      rankById,
      firstId: bySortOrder[0]?.id,
      lastId: bySortOrder[bySortOrder.length - 1]?.id,
    };
  }, [products]);

  // The editor redirects here with router state after a save. Show the toast
  // once, then clear the state so a refresh or a back-navigation does not
  // replay it.
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const toastCode = location.state?.toast;
  const shownFor = useRef(null);

  useEffect(() => {
    if (!toastCode || shownFor.current === toastCode) return;
    shownFor.current = toastCode;
    showToast(TOAST_MESSAGES[toastCode] || "Done.");
    navigate(location.pathname, { replace: true, state: null });
  }, [toastCode, showToast, navigate, location.pathname]);

  const handleToggled = useCallback(
    (id, active) => {
      mutate((current) => ({
        ...current,
        products: current.products.map((p) => (p.id === id ? { ...p, active } : p)),
      }));
    },
    [mutate]
  );

  const handleDeleted = useCallback(
    (id) => {
      mutate((current) => ({ ...current, products: current.products.filter((p) => p.id !== id) }));
    },
    [mutate]
  );

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Products</h1>
          <p className="mt-2 text-sm text-ink-500">
            {loading && !data
              ? "Loading…"
              : search.trim()
                ? `${filteredProducts.length} of ${products.length} ${
                    products.length === 1 ? "product" : "products"
                  } match "${search.trim()}".`
                : `${products.length} ${products.length === 1 ? "product" : "products"} · ${
                    products.filter((p) => p.active).length
                  } visible on the public site.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {products.length > 1 && (
            <button
              type="button"
              onClick={() => setReordering((v) => !v)}
              aria-pressed={reordering}
              className={reordering ? "btn-navy !px-4 !py-2.5 text-sm" : "btn-ghost !px-4 !py-2.5 text-sm"}
            >
              <ArrowUpDown className="h-4 w-4" />
              {reordering ? "Done reordering" : "Reorder products"}
            </button>
          )}
          <Link to="/admin/products/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {loading && !data && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading products" />
        </div>
      )}

      {error && (
        <p className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {data && products.length === 0 && (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <p className="font-display text-lg font-bold text-ink-900">No products yet</p>
          <p className="mt-1 text-sm text-ink-500">Add your first product to get started.</p>
        </div>
      )}

      {reordering && (
        <ProductReorderPanel
          products={products}
          onClose={() => setReordering(false)}
          onSaved={() => {
            setReordering(false);
            reload();
          }}
        />
      )}

      {!reordering && products.length > 0 && (
        <div className="relative mt-8 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or category…"
            className="field pl-9"
          />
        </div>
      )}

      {!reordering && products.length > 0 && filteredProducts.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="font-display text-lg font-bold text-ink-900">No products match &ldquo;{search}&rdquo;</p>
          <p className="mt-1 text-sm text-ink-500">Try a different name or category.</p>
        </div>
      )}

      {!reordering && filteredProducts.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th
                    className="px-3 py-3.5 font-semibold"
                    title="Position in the public product order — #1 shows first on the site"
                  >
                    Order
                  </th>
                  <th className="px-5 py-3.5 font-semibold">Product</th>
                  <th className="px-5 py-3.5 font-semibold">Category</th>
                  <th className="px-5 py-3.5 font-semibold">COA</th>
                  <th className="px-5 py-3.5 font-semibold">Visibility</th>
                  <th className="px-5 py-3.5 font-semibold" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="align-middle transition-colors hover:bg-navy-50/40">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 shrink-0 text-right text-xs font-semibold text-ink-400">
                          #{rankById.get(product.id)}
                        </span>
                        <ProductMoveButtons
                          product={product}
                          isFirst={product.id === firstId}
                          isLast={product.id === lastId}
                          onMoved={handleMoved}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                          <ProductVisual product={product} rounded="rounded-lg" />
                        </span>
                        <div>
                          <p className="font-semibold text-ink-900">{product.name}</p>
                          <p className="text-xs text-ink-500">/products/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-700">{categoryTitle(product.category)}</td>
                    <td className="px-5 py-3">
                      {product.coaUrl ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700"
                          title="COA uploaded"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <ProductActions product={product} onToggled={handleToggled} onDeleted={handleDeleted} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:gap-2.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
