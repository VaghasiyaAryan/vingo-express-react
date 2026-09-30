import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncRoute } from "../util.js";
import { productCategories } from "../../../shared/content.js";

export const productsRouter = Router();

/**
 * The public catalogue. Only active products, in the order the admin set —
 * this is what the homepage grid and the enquiry form's product matcher read.
 */
productsRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ products });
  })
);

/** One product plus up to three siblings from the same category. */
productsRouter.get(
  "/:slug",
  asyncRoute(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { slug: req.params.slug, active: true } });
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

    const related = await prisma.product.findMany({
      where: { category: product.category, active: true, NOT: { slug: product.slug } },
      orderBy: { sortOrder: "asc" },
      take: 3,
    });

    const category = productCategories.find((c) => c.slug === product.category) ?? null;

    res.json({ product, related, category });
  })
);
