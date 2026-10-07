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
    const products = await prisma.product.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
    res.json({ products });
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
