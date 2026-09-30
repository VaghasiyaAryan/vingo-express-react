import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncRoute, clean, parseListField, parseSpecsField, slugify } from "../../util.js";
import { productCategories } from "../../../../shared/content.js";

export const adminProductsRouter = Router();

const DEFAULT_COLORS = { base: "#f1f5f9", accent: "#cbd5e1", deep: "#94a3b8" };
const FORM_OPTIONS = ["flakes", "slices", "dices", "granules", "powder", "blend"];
const VALID_CATEGORIES = productCategories.map((c) => c.slug);

/** Normalises the admin product form's payload into a Prisma-shaped record. */
function productDataFromBody(body = {}) {
  const name = clean(body.name, 160);
  const slugInput = clean(body.slug, 160);
  const colors = body.colors && typeof body.colors === "object" ? body.colors : {};

  return {
    slug: slugify(slugInput || name),
    category: clean(body.category, 80),
    name,
    image: clean(body.image, 2000) || null,
    coaUrl: clean(body.coaUrl, 2000) || null,
    form: FORM_OPTIONS.includes(body.form) ? body.form : "flakes",
    colors: {
      base: clean(colors.base, 32) || DEFAULT_COLORS.base,
      accent: clean(colors.accent, 32) || DEFAULT_COLORS.accent,
      deep: clean(colors.deep, 32) || DEFAULT_COLORS.deep,
    },
    short: clean(body.short, 400),
    description: clean(body.description, 4000),
    forms: parseListField(body.forms),
    applications: parseListField(body.applications),
    specs: parseSpecsField(body.specs),
    active: body.active !== false,
  };
}

function validate(data) {
  if (!data.name) return "A product name is required.";
  if (!data.slug) return "A URL slug is required — enter one, or give the product a name it can be derived from.";
  if (!data.category) return "A category is required.";
  if (!VALID_CATEGORIES.includes(data.category)) return `"${data.category}" is not one of the known categories.`;
  if (!data.short) return "A short description is required.";
  if (!data.description) return "A full description is required.";
  return null;
}

adminProductsRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    // Hidden products sort after visible ones, and within each of those,
    // products missing a COA sort after ones that have it — so the list
    // stays scannable both for what's actually live on the site and for
    // which products still need a certificate uploaded. `coaUrl` presence
    // can't be expressed in Prisma's orderBy directly (it's a plain nullable
    // string, not a boolean), so it's layered on as a second, stable JS sort
    // — applied before the `active` sort so `active` remains the outermost,
    // most significant grouping.
    const products = await prisma.product.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    products.sort((a, b) => Number(Boolean(b.coaUrl)) - Number(Boolean(a.coaUrl)));
    products.sort((a, b) => Number(b.active) - Number(a.active));
    res.json({ products });
  })
);

/**
 * Bulk reorder for drag-and-drop: `ids` is every product ID in its new,
 * complete top-to-bottom order, and `sortOrder` is rewritten to match that
 * sequence exactly (0, 1, 2, …). This is what the public site's product
 * order actually reads (see products.js) — the admin's own product list
 * sorts by visibility/COA for scanning, not by this, so this endpoint (and
 * the drag UI that calls it) is the only place that order is set directly
 * rather than nudged one step via `/:id/move`.
 */
adminProductsRouter.post(
  "/reorder",
  asyncRoute(async (req, res) => {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
      res.status(400).json({ error: "ids must be a non-empty array of product IDs." });
      return;
    }

    const existingCount = await prisma.product.count({ where: { id: { in: ids } } });
    if (existingCount !== ids.length || existingCount !== (await prisma.product.count())) {
      res.status(400).json({ error: "ids must include every product, each exactly once." });
      return;
    }

    await prisma.$transaction(
      ids.map((id, index) => prisma.product.update({ where: { id }, data: { sortOrder: index } }))
    );
    res.json({ ok: true });
  })
);

adminProductsRouter.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.json({ product });
  })
);

adminProductsRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const data = productDataFromBody(req.body);
    const problem = validate(data);
    if (problem) {
      res.status(400).json({ error: problem });
      return;
    }

    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) {
      res.status(409).json({ error: `A product with slug "${data.slug}" already exists.` });
      return;
    }

    // New products go to the end of the list; the admin can reorder later.
    const count = await prisma.product.count();
    const product = await prisma.product.create({ data: { ...data, sortOrder: count } });
    res.status(201).json({ product });
  })
);

adminProductsRouter.put(
  "/:id",
  asyncRoute(async (req, res) => {
    const data = productDataFromBody(req.body);
    const problem = validate(data);
    if (problem) {
      res.status(400).json({ error: problem });
      return;
    }

    const [current, slugOwner] = await Promise.all([
      prisma.product.findUnique({ where: { id: req.params.id } }),
      prisma.product.findUnique({ where: { slug: data.slug } }),
    ]);

    if (!current) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    if (slugOwner && slugOwner.id !== current.id) {
      res.status(409).json({ error: `Another product already uses slug "${data.slug}".` });
      return;
    }

    const product = await prisma.product.update({ where: { id: current.id }, data });
    res.json({ product });
  })
);

/**
 * Repositions a product among ALL products — not just its own category —
 * by changing `sortOrder`. That field is what the public site actually
 * reads for its flat "All Products" order (see products.js), so this is
 * the only place in the admin that can change it, and this is how
 * "arrange the products shown on the public page" is controlled.
 *
 *   up / down — swap with whichever product is globally adjacent
 *   top / bottom — jump to before the first / after the last product overall
 */
adminProductsRouter.patch(
  "/:id/move",
  asyncRoute(async (req, res) => {
    const direction = req.body?.direction;
    if (!["up", "down", "top", "bottom"].includes(direction)) {
      res.status(400).json({ error: 'direction must be "up", "down", "top" or "bottom".' });
      return;
    }

    const current = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!current) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

    if (direction === "up" || direction === "down") {
      const neighbor = await prisma.product.findFirst({
        where: { sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder } },
        orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
      });

      // Already first/last overall — nothing to swap with.
      if (!neighbor) {
        res.json({ product: current });
        return;
      }

      const [product] = await prisma.$transaction([
        prisma.product.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
        prisma.product.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
      ]);
      res.json({ product });
      return;
    }

    const edge = await prisma.product.aggregate({
      _min: { sortOrder: true },
      _max: { sortOrder: true },
    });
    const newSortOrder =
      direction === "top" ? (edge._min.sortOrder ?? 0) - 1 : (edge._max.sortOrder ?? 0) + 1;

    const product = await prisma.product.update({ where: { id: current.id }, data: { sortOrder: newSortOrder } });
    res.json({ product });
  })
);

adminProductsRouter.patch(
  "/:id/active",
  asyncRoute(async (req, res) => {
    const active = Boolean(req.body?.active);
    try {
      const product = await prisma.product.update({ where: { id: req.params.id }, data: { active } });
      res.json({ product });
    } catch {
      res.status(404).json({ error: "Product not found." });
    }
  })
);

adminProductsRouter.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    try {
      await prisma.product.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Product not found." });
    }
  })
);
