import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncRoute, escapeHtml } from "../util.js";
import { company, productCategories } from "../../../shared/content.js";

/**
 * sitemap.xml, robots.txt and the web app manifest — the three files a
 * crawler or an installing browser fetches by convention, generated from the
 * live product table rather than kept in sync by hand.
 */

export const wellKnownRouter = Router();

const BASE = company.websiteUrl;

const STATIC_ROUTES = [
  "",
  "/about",
  "/products",
  "/faq",
  "/contact",
  "/privacy-policy",
  "/terms-and-conditions",
  "/cookie-policy",
];

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

/**
 * llms.txt (https://llmstxt.org): a plain-Markdown summary of the site for AI
 * assistants and answer engines — who the business is, the key pages, and the
 * live product list, each with its canonical URL. Built from the same sources
 * as the pages themselves, so it never drifts from what the site says.
 */
wellKnownRouter.get(
  "/llms.txt",
  asyncRoute(async (req, res) => {
    let products = [];
    try {
      products = await prisma.product.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: { slug: true, name: true, short: true, category: true },
      });
    } catch (err) {
      console.error("llms.txt could not read products:", err);
    }

    const lines = [
      `# ${company.name}`,
      "",
      `> ${company.name} is an exporter based in ${company.address}, supplying dehydrated fruits, dehydrated vegetables, fruit and vegetable powders, and dehydrated instant food mixes to food manufacturers, distributors and retailers worldwide. Samples, LCL and FCL orders; custom cuts, mesh sizes and private-label packaging on request.`,
      "",
      `- Phone / WhatsApp: ${company.phoneDisplay}`,
      `- Email: ${company.email}`,
      `- Website: ${BASE}`,
      "",
      "## Pages",
      "",
      `- [Home](${BASE}/): overview of the business and featured products`,
      `- [About](${BASE}/about): who we are, how we process and the markets we ship to`,
      `- [Products](${BASE}/products): the full catalogue by category`,
      `- [FAQ](${BASE}/faq): samples, minimum orders, packaging, documentation and shipping`,
      `- [Contact](${BASE}/contact): request a quotation or samples`,
    ];

    for (const category of productCategories) {
      const inCategory = products.filter((p) => p.category === category.slug);
      if (!inCategory.length) continue;
      lines.push("", `## ${category.title}`, "");
      for (const p of inCategory) lines.push(`- [${p.name}](${BASE}/products/${p.slug}): ${p.short}`);
    }

    lines.push(
      "",
      "## Optional",
      "",
      `- [Product catalogue PDF](${BASE}/api/catalog): every active product in one document`,
      `- [Privacy Policy](${BASE}/privacy-policy)`,
      `- [Terms & Conditions](${BASE}/terms-and-conditions)`,
      ""
    );

    res.type("text/plain").set("Cache-Control", "public, max-age=3600").send(lines.join("\n"));
  })
);

wellKnownRouter.get("/robots.txt", (req, res) => {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "Disallow: /api/",
    // The catalogue PDF is meant to be found and shared.
    "Allow: /api/catalog",
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
  // PNGs for Android's home-screen and splash icons (it does not use SVG there),
  // plus the SVG for browsers that prefer it.
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/logo-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ],
};

// Both names are served: /manifest.webmanifest is the spec'd extension, and
// /manifest.json is what the Next.js app used to emit.
for (const path of ["/manifest.webmanifest", "/manifest.json"]) {
  wellKnownRouter.get(path, (req, res) => {
    res.type("application/manifest+json").set("Cache-Control", "public, max-age=3600").send(JSON.stringify(MANIFEST));
  });
}
