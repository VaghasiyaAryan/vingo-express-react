import { useState } from "react";
import { ChevronsUp, ChevronUp, ChevronDown, ChevronsDown, Loader2 } from "lucide-react";
import { endpoints } from "@/lib/api.js";
import { useToast } from "./Toast.jsx";

/**
 * Repositions a product among ALL products, not just its own category — this
 * is what actually controls the order products appear in on the public
 * site's "All Products" view (see server/src/routes/products.js and the
 * admin products route's `/:id/move` handler, the only thing that can
 * change `sortOrder`).
 */
const ACTIONS = [
  { direction: "top", Icon: ChevronsUp, label: "Move to top" },
  { direction: "up", Icon: ChevronUp, label: "Move up" },
  { direction: "down", Icon: ChevronDown, label: "Move down" },
  { direction: "bottom", Icon: ChevronsDown, label: "Move to bottom" },
];

export default function ProductMoveButtons({ product, isFirst, isLast, onMoved }) {
  const [pending, setPending] = useState(null); // direction currently in flight, or null
  const showToast = useToast();

  async function move(direction) {
    setPending(direction);
    try {
      await endpoints.admin.moveProduct(product.id, direction);
      await onMoved();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      {ACTIONS.map(({ direction, Icon, label }) => {
        const boundary = (direction === "top" || direction === "up") && isFirst
          ? true
          : (direction === "bottom" || direction === "down") && isLast;
        const disabled = Boolean(pending) || boundary;
        return (
          <button
            key={direction}
            type="button"
            disabled={disabled}
            onClick={() => move(direction)}
            aria-label={`${label} — ${product.name}`}
            title={label}
            className="flex h-4 w-6 items-center justify-center rounded text-ink-400 transition-colors hover:bg-slate-100 hover:text-ink-900 disabled:opacity-25 disabled:hover:bg-transparent"
          >
            {pending === direction ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
