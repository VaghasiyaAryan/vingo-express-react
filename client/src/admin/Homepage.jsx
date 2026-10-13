import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { hero, productCategories } from "@shared/content.js";
import { endpoints } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { useToast } from "./Toast.jsx";

const POSITION_NAMES = ["Top left", "Top right", "Bottom left", "Bottom right"];

const fetchItems = (signal) => endpoints.admin.heroItems({ signal });
const fetchProducts = (signal) => endpoints.admin.products({ signal });

export default function Homepage() {
  useDocumentTitle("Homepage");
  const showToast = useToast();

  const { data, error, loading, mutate } = useApi(fetchItems);
  const { data: productData } = useApi(fetchProducts);
  const products = productData?.products ?? [];

  const [items, setItems] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setItems(data.items);
  }, [data]);

  const maxLength = data?.maxLength ?? 40;
  const dirty =
    items && data && items.some((item, i) => item.label !== data.items[i].label || item.slug !== data.items[i].slug);
  const valid = items?.every((item) => item.label.trim());

  function setField(index, field, value) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      const saved = await endpoints.admin.saveHeroItems(items);
      mutate((prev) => ({ ...prev, items: saved.items }));
      showToast("Homepage buttons saved.");
    } catch (err) {
      showToast(err.message || "Could not save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  // Grouped by category, so the dropdown reads like the catalogue.
  const groups = productCategories
    .map((c) => ({ title: c.title, products: products.filter((p) => p.category === c.slug) }))
    .filter((g) => g.products.length > 0);

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl font-bold text-ink-900">Homepage</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
        The four buttons floating around the logo at the top of the homepage. Each one opens the product you pick
        here. Changes go live as soon as you save.
      </p>

      {loading && !data && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-navy-400" aria-label="Loading homepage buttons" />
        </div>
      )}

      {error && (
        <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {items && (
        <form onSubmit={handleSubmit} className="mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-lg font-bold text-ink-900">Floating buttons</h2>

          <div className="mt-5 space-y-5">
            {items.map((item, i) => {
              const linked = products.find((p) => p.slug === item.slug);
              return (
                <fieldset key={i} className="rounded-xl border border-slate-200 p-4">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-500">
                    {POSITION_NAMES[i] ?? `Button ${i + 1}`}
                  </legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label" htmlFor={`hero-label-${i}`}>
                        Button text
                      </label>
                      <input
                        id={`hero-label-${i}`}
                        type="text"
                        value={item.label}
                        maxLength={maxLength}
                        onChange={(e) => setField(i, "label", e.target.value)}
                        placeholder={hero.floatingProducts[i]?.label}
                        required
                        className="field"
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`hero-product-${i}`}>
                        Opens
                      </label>
                      <select
                        id={`hero-product-${i}`}
                        value={item.slug}
                        onChange={(e) => setField(i, "slug", e.target.value)}
                        className="field cursor-pointer"
                      >
                        <option value="">All products (catalogue page)</option>
                        {groups.map((g) => (
                          <optgroup key={g.title} label={g.title}>
                            {g.products.map((p) => (
                              <option key={p.slug} value={p.slug}>
                                {p.name}
                                {p.active ? "" : " (hidden)"}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        {/* Keep a saved choice selectable even if that product was deleted. */}
                        {item.slug && products.length > 0 && !linked && (
                          <option value={item.slug}>{item.slug} (no longer exists)</option>
                        )}
                      </select>
                      {linked && !linked.active && (
                        <p className="mt-1.5 text-xs text-amber-700">
                          This product is hidden, so the button opens the catalogue until you show it again.
                        </p>
                      )}
                    </div>
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setItems(hero.floatingProducts)}
              className="btn-ghost !py-2 text-sm"
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4" />
              Reset to defaults
            </button>
            <button type="submit" className="btn-primary" disabled={!dirty || !valid || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
