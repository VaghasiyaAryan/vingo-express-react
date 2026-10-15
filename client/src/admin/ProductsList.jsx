import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, Pencil, Loader2, GripVertical } from "lucide-react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import ProductVisual from "@/components/ProductVisual.jsx";
import { productCategories } from "@shared/content.js";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useToast } from "./Toast.jsx";
import ProductActions from "./ProductActions.jsx";

const TOAST_MESSAGES = {
  created: "Product created.",
  updated: "Product changes saved.",
};

function categoryTitle(slug) {
  return productCategories.find((c) => c.slug === slug)?.title || slug;
}

/**
 * One product row. Only the ⋮⋮ handle starts a drag, so clicking Edit, the
 * visibility toggle or the row text still works normally. `touch-none` on the
 * handle lets a finger drag it on a phone instead of scrolling the page.
 */
function SortableRow({ product, position, dragDisabled, onToggled, onDeleted }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: dragDisabled,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, position: "relative", zIndex: isDragging ? 10 : undefined }}
      className={`align-middle transition-colors ${isDragging ? "bg-white shadow-lift" : "hover:bg-navy-50/40"}`}
    >
      <td className="w-px py-3 pl-3 pr-0">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Move ${product.name} (position ${position})`}
          title="Drag to reorder"
          disabled={dragDisabled}
          className="flex h-9 w-7 touch-none items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-navy-50 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 enabled:cursor-grab enabled:active:cursor-grabbing disabled:opacity-40"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="w-px whitespace-nowrap py-3 pl-1 pr-2 text-xs font-semibold tabular-nums text-ink-400">{position}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
            <ProductVisual product={product} rounded="rounded-lg" sizes="64px" />
          </span>
          <div>
            <p className="font-semibold text-ink-900">{product.name}</p>
            <p className="text-xs text-ink-500">/products/{product.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 text-ink-700">{categoryTitle(product.category)}</td>
      <td className="px-5 py-3">
        <ProductActions product={product} onToggled={onToggled} onDeleted={onDeleted} />
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
  );
}

export default function ProductsList() {
  useDocumentTitle("Products");

  const fetchProducts = useCallback((signal) => endpoints.admin.products({ signal }), []);
  const { data, error, loading, mutate, reload } = useApi(fetchProducts);
  const products = useMemo(() => data?.products ?? [], [data]);
  const [savingOrder, setSavingOrder] = useState(false);

  // Mouse/touch: a drag starts after moving 4px, so a plain click on the handle
  // does nothing. Keyboard: focus the handle, Space to pick up, arrows to move,
  // Space to drop, Escape to cancel.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const nameOf = useCallback((id) => products.find((p) => p.id === id)?.name ?? "product", [products]);
  const positionOf = useCallback((id) => products.findIndex((p) => p.id === id) + 1, [products]);

  // What a screen reader says while reordering — product names, not ids.
  const announcements = useMemo(
    () => ({
      onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}, position ${positionOf(active.id)} of ${products.length}.`,
      onDragOver: ({ active, over }) =>
        over ? `${nameOf(active.id)} moved to position ${positionOf(over.id)} of ${products.length}.` : undefined,
      onDragEnd: ({ active, over }) =>
        over ? `${nameOf(active.id)} dropped at position ${positionOf(over.id)}. Saving order.` : `${nameOf(active.id)} dropped.`,
      onDragCancel: ({ active }) => `Reordering cancelled. ${nameOf(active.id)} returned to position ${positionOf(active.id)}.`,
    }),
    [nameOf, positionOf, products.length]
  );

  /**
   * Moves the row immediately, then saves. If the save fails the list snaps
   * back so it never shows an order the website does not have; if the list
   * changed elsewhere meanwhile, it reloads.
   */
  async function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const previous = products;
    const next = arrayMove(previous, positionOf(active.id) - 1, positionOf(over.id) - 1);
    mutate((current) => ({ ...current, products: next }));
    setSavingOrder(true);
    try {
      await endpoints.admin.saveProductOrder(next.map((p) => p.id));
      showToast("Order saved — the website now shows products in this order.");
    } catch (err) {
      mutate((current) => ({ ...current, products: previous }));
      showToast(err.message || "Could not save the new order. Please try again.", "error");
      if (err.status === 409) reload();
    } finally {
      setSavingOrder(false);
    }
  }

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
              : `${products.length} ${products.length === 1 ? "product" : "products"} · ${
                  products.filter((p) => p.active).length
                } visible on the public site.`}
          </p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
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

      {products.length > 0 && (
        <>
          <p className="mt-8 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-500">
            <GripVertical className="h-4 w-4 text-ink-400" aria-hidden="true" />
            Drag the handle to set the order products appear on the website — the homepage shows the first three.
            Changes save automatically.
            {savingOrder && (
              <span className="inline-flex items-center gap-1 font-medium text-navy-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </span>
            )}
          </p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                onDragEnd={handleDragEnd}
                accessibility={{ announcements }}
              >
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="w-px py-3.5 pl-3 pr-0" aria-label="Reorder" />
                      <th className="w-px py-3.5 pl-1 pr-2 font-semibold">#</th>
                      <th className="px-5 py-3.5 font-semibold">Product</th>
                      <th className="px-5 py-3.5 font-semibold">Category</th>
                      <th className="px-5 py-3.5 font-semibold">Visibility</th>
                      <th className="px-5 py-3.5 font-semibold" aria-label="Actions" />
                    </tr>
                  </thead>
                  <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((product, i) => (
                        <SortableRow
                          key={product.id}
                          product={product}
                          position={i + 1}
                          dragDisabled={savingOrder}
                          onToggled={handleToggled}
                          onDeleted={handleDeleted}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
