import { Router } from "express";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "../prisma.js";
import { asyncRoute } from "../util.js";
import { company, productCategories } from "../../../shared/content.js";
import { CatalogDocument } from "../pdf/CatalogDocument.js";

export const catalogRouter = Router();

// Cheap reachability/latency ping for the admin System monitor — deliberately
// does NOT generate the PDF (that is expensive, and this gets polled every
// second while the System page is open).
catalogRouter.head("/", (req, res) => res.status(200).end());

/**
 * Deliberately public/unauthenticated: mailto: links cannot carry file
 * attachments, so "send the catalogue in an enquiry reply" has to mean a link
 * the customer can click themselves. The PDF only contains information that
 * is already public on the website.
 */
catalogRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    const productsByCategory = {};
    for (const product of products) {
      (productsByCategory[product.category] ||= []).push(product);
    }

    const buffer = await renderToBuffer(
      CatalogDocument({ company, categories: productCategories, productsByCategory })
    );

    const filename = `${company.shortName.replace(/\s+/g, "-")}-Product-Catalogue.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    });
    res.send(buffer);
  })
);
