import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncRoute, clean, parseListField, parseSpecsField, slugify } from "../../util.js";
import { productCategories } from "../../../../shared/content.js";

export const adminProductsRouter = Router();

const DEFAULT_COLORS = { base: "#f1f5f9", accent: "#cbd5e1", deep: "#94a3b8" };
const FORM_OPTIONS = ["flakes", "slices", "dices", "granules", "powder", "blend"];
const VALID_CATEGORIES = productCategories.map((c) => c.slug);

/** "#a1b2c3" / "#abc" only — anything else falls back to the default colour. */
function hexColor(value, fallback) {
  const v = clean(value, 9);
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ? v : fallback;
}

/**
 * The product photo address: a path on this site (/products/x.webp,
 * /api/images/:id) or an absolute http(s) URL. Anything else — javascript:,
 * data:, protocol-relative //host — is rejected.
 */
function imageField(value) {
  const v = clean(value, 2000);
  if (!v) return { image: null };
  if (/^\/(?!\/)[^\s]*$/.test(v)) return { image: v };
  try {
    const url = new URL(v);
    if (url.protocol === "https:" || url.protocol === "http:") return { image: url.href };
  } catch {
    // not a URL — fall through
  }
  return { image: null, imageError: "The photo must be an uploaded image or a link starting with https://." };
}

/** Normalises the admin product form's payload into a Prisma-shaped record. */
function productDataFromBody(body = {}) {
  const name = clean(body.name, 160);
  const slugInput = clean(body.slug, 160);
  const colors = body.colors && typeof body.colors === "object" ? body.colors : {};
  const { image, imageError } = imageField(body.image);

  return {
    slug: slugify(slugInput || name),
    category: clean(body.category, 80),
    name,
    image,
    // Not a column — read by validate() and removed before saving.
    _imageError: imageError,
    form: FORM_OPTIONS.includes(body.form) ? body.form : "flakes",
    colors: {
      base: hexColor(colors.base, DEFAULT_COLORS.base),
      accent: hexColor(colors.accent, DEFAULT_COLORS.accent),
      deep: hexColor(colors.deep, DEFAULT_COLORS.deep),
    },
    short: clean(body.short, 400),
    description: clean(body.description, 4000),
    forms: parseListField(body.forms),
    applications: parseListField(body.applications),
    specs: parseSpecsField(body.specs),
    active: body.active !== false,
  };
}

/** The record as saved — without the validation-only helper fields. */
function withoutHelpers({ _imageError, ...record }) {
  return record;
}

function validate(data) {
  if (data._imageError) return data._imageError;
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
    // Visible products first, in the order visitors see them (homepage
    // preview, catalogue page); hidden products after, in their saved order.
    const products = await prisma.product.findMany({
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
    res.json({ products });
  })
);

/**
 * Saves a new display order. The body must list every product id exactly
 * once — a partial or stale list (another admin added or deleted a product
 * meanwhile) is refused rather than leaving gaps or duplicates. All rows are
 * updated in one transaction, so the order is never half-saved.
 */
adminProductsRouter.put(
  "/order",
  asyncRoute(async (req, res) => {
    const ids = req.body?.ids;
    const existing = await prisma.product.findMany({ select: { id: true } });
    const known = new Set(existing.map((p) => p.id));

    const valid =
      Array.isArray(ids) &&
      ids.length === known.size &&
      new Set(ids).size === ids.length &&
      ids.every((id) => typeof id === "string" && known.has(id));
    if (!valid) {
      res.status(409).json({ error: "The product list has changed since you opened it. Reload the page and try again." });
      return;
    }

    await prisma.$transaction(ids.map((id, index) => prisma.product.update({ where: { id }, data: { sortOrder: index } })));
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

    // New products go to the end of the list; the admin can drag them into
    // place later. After the last position in use — not the product count,
    // which collides with existing positions once a product has been deleted.
    const { _max } = await prisma.product.aggregate({ _max: { sortOrder: true } });
    const product = await prisma.product.create({
      data: { ...withoutHelpers(data), sortOrder: (_max.sortOrder ?? -1) + 1 },
    });
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

    const product = await prisma.product.update({ where: { id: current.id }, data: withoutHelpers(data) });
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
