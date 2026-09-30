import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2 } from "lucide-react";
import ProductVisual from "@/components/ProductVisual.jsx";
import { productCategories } from "@shared/content.js";
import { endpoints } from "@/lib/api.js";
import { useToast } from "./Toast.jsx";

function categoryTitle(slug) {
  return productCategories.find((c) => c.slug === slug)?.title || slug;
}

function SortableRow({ product }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-2.5 last:border-b-0 ${
        isDragging ? "relative z-10 shadow-lift" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${product.name}`}
        title="Drag to reorder"
        // touch-none stops the browser's own scroll gesture from fighting the
        // drag sensor on mobile — without it, a touch-drag here just scrolls
        // the page instead of picking the row up.
        className="flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-ink-400 hover:bg-slate-100 hover:text-ink-700 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
        <ProductVisual product={product} rounded="rounded-lg" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{product.name}</p>
        <p className="text-xs text-ink-500">{categoryTitle(product.category)}</p>
      </div>
      {!product.active && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-500">
          Hidden
        </span>
      )}
    </li>
  );
}

/**
 * The admin's main product table sorts by visibility/COA for scanning (see
 * the admin route's orderBy), which deliberately isn't the public order —
 * so dragging rows *there* wouldn't mean what it looks like it means. This
 * is a separate, focused view: every product in its exact public sequence,
 * nothing else, safe to drag freely.
 */
export default function ProductReorderPanel({ products, onClose, onSaved }) {
  const [order, setOrder] = useState(() => [...products].sort((a, b) => a.sortOrder - b.sortOrder));
  const [saving, setSaving] = useState(false);
  const showToast = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((current) => {
      const oldIndex = current.findIndex((p) => p.id === active.id);
      const newIndex = current.findIndex((p) => p.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await endpoints.admin.reorderProducts(order.map((p) => p.id));
      showToast("Product order saved.");
      onSaved();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-navy-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-navy-50/60 px-5 py-3.5">
        <div>
          <p className="text-sm font-semibold text-ink-900">Drag to reorder</p>
          <p className="text-xs text-ink-500">This is the exact order products appear in on the public site.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="btn-ghost !px-4 !py-2 text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary !px-4 !py-2 text-sm">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save order
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <ul className="menu-scroll max-h-[70vh] overflow-y-auto">
            {order.map((product) => (
              <SortableRow key={product.id} product={product} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
