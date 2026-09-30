import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncRoute } from "../../util.js";
import { emailConfigured, uploadsConfigured } from "../../config.js";
import { company, productCategories } from "../../../../shared/content.js";

export const adminSystemRouter = Router();

/**
 * Polled every second by the System page's live heartbeat monitor.
 * Admin-gated: it reveals database latency, which is mild operational
 * information — not something to expose publicly for repeated polling.
 */
adminSystemRouter.get(
  "/health",
  asyncRoute(async (req, res) => {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        ok: true,
        db: { ok: true, latencyMs: Date.now() - start },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.json({
        ok: true,
        db: { ok: false, error: err.message },
        timestamp: new Date().toISOString(),
      });
    }
  })
);

/** What the admin UI needs to know about how this deployment is wired up. */
adminSystemRouter.get("/config", (req, res) => {
  res.json({
    emailConfigured: emailConfigured(),
    uploadsConfigured: uploadsConfigured(),
    catalogUrl: `${company.websiteUrl}/api/catalog`,
  });
});

/** Thirty buckets, oldest first, one per day, zero-filled. */
function buildTrend(rows) {
  const days = new Map();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (days.has(key)) days.set(key, days.get(key) + 1);
  }
  return Array.from(days, ([date, count]) => ({ date, count }));
}

adminSystemRouter.get(
  "/stats",
  asyncRoute(async (req, res) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, statusGroups, activeProducts, totalProducts, recent, trendRows] = await Promise.all([
      prisma.inquiry.count(),
      prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.product.count({ where: { active: true } }),
      prisma.product.count(),
      prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.inquiry.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
    ]);

    res.json({
      total,
      statusCounts: Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])),
      activeProducts,
      totalProducts,
      recent,
      trend: buildTrend(trendRows),
    });
  })
);

/** Per-category active-product counts for the Catalogue page. */
adminSystemRouter.get(
  "/catalog-summary",
  asyncRoute(async (req, res) => {
    const products = await prisma.product.findMany({ where: { active: true }, select: { category: true } });

    const counts = {};
    for (const p of products) counts[p.category] = (counts[p.category] || 0) + 1;

    res.json({
      activeCount: products.length,
      catalogUrl: `${company.websiteUrl}/api/catalog`,
      categories: productCategories.map((c) => ({ slug: c.slug, title: c.title, count: counts[c.slug] || 0 })),
    });
  })
);

/**
 * Issues short-lived client tokens so the browser can upload product/team
 * photos and COA documents directly to Blob storage, rather than streaming
 * multi-megabyte files through this API.
 */
adminSystemRouter.post(
  "/upload-token",
  asyncRoute(async (req, res) => {
    if (!uploadsConfigured()) {
      res.status(503).json({
        error: "Uploads are not configured — set BLOB_READ_WRITE_TOKEN, or paste a URL instead.",
      });
      return;
    }

    const { handleUpload } = await import("@vercel/blob/client");

    try {
      const jsonResponse = await handleUpload({
        body: req.body,
        request: req,
        onBeforeGenerateToken: async () => ({
          // Images for product/team photos, PDF for Certificates of Analysis.
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"],
          maximumSizeInBytes: 12 * 1024 * 1024,
          addRandomSuffix: true,
        }),
        // Fired by Blob storage as a webhook once the upload lands. Nothing to
        // record on our side — the product form already holds the returned URL
        // — but the handler is required, and it never runs on localhost.
        onUploadCompleted: async () => {},
      });
      res.json(jsonResponse);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })
);
