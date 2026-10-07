import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncRoute, escapeHtml } from "../util.js";
import { company } from "../../../shared/content.js";

/**
 * sitemap.xml, robots.txt and the web app manifest — the three files a
 * crawler or an installing browser fetches by convention, generated from the
 * live product table rather than kept in sync by hand.
 */

export const wellKnownRouter = Router();

const BASE = company.websiteUrl;

const STATIC_ROUTES = ["", "/privacy-policy", "/terms-and-conditions", "/cookie-policy"];

wellKnownRouter.get(
  "/sitemap.xml",
  asyncRoute(async (req, res) => {
    const now = new Date();

    let products = [];
    try {
      products = await prisma.product.findMany({
        where: { active: true },
        select: { slug: true, updatedAt: true },
      });
    } catch (err) {
      // Still serve the static routes rather than a 500 — a half sitemap is
      // far better than none.
      console.error("Sitemap could not read products:", err);
    }

    const entries = [
      ...STATIC_ROUTES.map((path) => ({ url: `${BASE}${path}`, lastModified: now })),
      ...products.map((p) => ({ url: `${BASE}/products/${p.slug}`, lastModified: p.updatedAt })),
    ];

    const body = entries
      .map(
        (entry) =>
          `  <url>\n    <loc>${escapeHtml(entry.url)}</loc>\n    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n  </url>`
      )
      .join("\n");

    res
      .type("application/xml")
      .set("Cache-Control", "public, max-age=3600")
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
  })
);

wellKnownRouter.get("/robots.txt", (req, res) => {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "Disallow: /api/",
    "",
    `Sitemap: ${BASE}/sitemap.xml`,
    "",
  ];
  res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(lines.join("\n"));
});

const MANIFEST = {
  name: company.name,
  short_name: company.shortName,
  description: "Exporter of dehydrated fruits, vegetables, powders and instant food mixes.",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#2e2c75",
  icons: [{ src: "/logo-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
};

// Both names are served: /manifest.webmanifest is the spec'd extension, and
// /manifest.json is what the Next.js app used to emit.
for (const path of ["/manifest.webmanifest", "/manifest.json"]) {
  wellKnownRouter.get(path, (req, res) => {
    res.type("application/manifest+json").set("Cache-Control", "public, max-age=3600").send(JSON.stringify(MANIFEST));
  });
}
