import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from "@react-pdf/renderer";

/**
 * The branded product catalogue PDF.
 *
 * Written with `React.createElement` (aliased to `h`) rather than JSX so the
 * Express server runs on plain Node with no compile step anywhere in the
 * stack — this is the only React component on the backend, and a whole build
 * pipeline is not worth one file.
 *
 * Uses @react-pdf/renderer's built-in Helvetica — no custom font
 * registration, so rendering never depends on a network fetch.
 */

const NAVY = "#2e2c75";
const ORANGE = "#f16629";
const INK = "#334155";
const MUTED = "#64748b";

const PAGE_W = 595.28;
const PAGE_H = 841.89;

const here = path.dirname(fileURLToPath(import.meta.url));

// Read once at module load rather than per request.
const LOGO_SRC = fs.readFileSync(path.join(here, "assets", "vingo-logo.png"));
const ICON_SRC = fs.readFileSync(path.join(here, "assets", "vingo-icon.png"));

// Real contact details as printed on the official VinGo International
// letterhead — kept local to the PDF rather than shared/content.js, which
// still has placeholder values pending a decision on the public site.
const LETTERHEAD_CONTACT = {
  phone: "+91 93132 51136",
  email: "hello@vingointernational.com",
  website: "www.vingo.international",
};

const styles = StyleSheet.create({
  page: { paddingTop: 96, paddingBottom: 110, paddingHorizontal: 48, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  coverPage: { paddingTop: 200, paddingBottom: 110, paddingHorizontal: 56, fontFamily: "Helvetica", color: INK },
  coverTag: { fontSize: 10, color: ORANGE, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginBottom: 14 },
  coverTitle: { fontSize: 30, color: NAVY, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  coverSubtitle: { fontSize: 13, color: MUTED, marginBottom: 40 },
  coverMeta: { fontSize: 10, color: MUTED, marginBottom: 4 },
  categoryHeader: { fontSize: 16, color: NAVY, fontFamily: "Helvetica-Bold", marginBottom: 12, marginTop: 18 },
  product: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  productName: { fontSize: 12, color: "#0f172a", fontFamily: "Helvetica-Bold", marginBottom: 3 },
  productShort: { fontSize: 10, color: INK, marginBottom: 4, lineHeight: 1.4 },
  productForms: { fontSize: 9, color: MUTED },
  formsLabel: { fontFamily: "Helvetica-Bold", color: "#475569" },
  headerLogo: { position: "absolute", top: 40, left: 48, width: 118, height: 118 * (308 / 786) },
  watermark: { position: "absolute", top: PAGE_H / 2 - 130, left: PAGE_W / 2 - 160, width: 320, height: 320 * (308 / 786), opacity: 0.05 },
  footerRule: { position: "absolute", bottom: 78, left: 48, right: 48, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  footerRow: { position: "absolute", bottom: 52, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between" },
  footerLabel: { fontSize: 9, color: MUTED },
  footerWebsite: { position: "absolute", bottom: 36, left: 48, fontSize: 9, color: MUTED },
  pageNumber: { position: "absolute", bottom: 36, right: 48, fontSize: 8, color: MUTED },
});

/** Two-tone blob bleeding off the top-right corner, echoing the letterhead. */
function TopFlourish() {
  const navyPath = `M ${PAGE_W - 210} 0 L ${PAGE_W} 0 L ${PAGE_W} 130 C ${PAGE_W - 8} 158, ${PAGE_W - 60} 168, ${PAGE_W - 118} 150 C ${PAGE_W - 168} 134, ${PAGE_W - 210} 92, ${PAGE_W - 210} 40 Z`;
  const orangePath = `M ${PAGE_W - 150} 0 L ${PAGE_W - 40} 0 L ${PAGE_W - 40} 55 C ${PAGE_W - 46} 72, ${PAGE_W - 76} 78, ${PAGE_W - 104} 68 C ${PAGE_W - 132} 58, ${PAGE_W - 150} 34, ${PAGE_W - 150} 14 Z`;

  return h(
    Svg,
    { width: PAGE_W, height: 170, style: { position: "absolute", top: 0, left: 0 }, fixed: true },
    h(Path, { d: navyPath, fill: NAVY }),
    h(Path, { d: orangePath, fill: ORANGE, opacity: 0.9 })
  );
}

/** Full-width gentle wave anchored to the bottom edge, echoing the letterhead. */
function BottomFlourish() {
  const H = PAGE_H;
  const navyPath = `M 0 ${H} L 0 ${H - 46} C ${PAGE_W * 0.22} ${H - 82}, ${PAGE_W * 0.38} ${H - 18}, ${PAGE_W * 0.62} ${H - 50} C ${PAGE_W * 0.8} ${H - 74}, ${PAGE_W * 0.9} ${H - 36}, ${PAGE_W} ${H - 54} L ${PAGE_W} ${H} Z`;
  const orangePath = `M 0 ${H} L 0 ${H - 20} C ${PAGE_W * 0.22} ${H - 48}, ${PAGE_W * 0.38} ${H - 4}, ${PAGE_W * 0.62} ${H - 22} C ${PAGE_W * 0.8} ${H - 38}, ${PAGE_W * 0.9} ${H - 12}, ${PAGE_W} ${H - 24} L ${PAGE_W} ${H} Z`;

  return h(
    Svg,
    { width: PAGE_W, height: 100, style: { position: "absolute", bottom: 0, left: 0 }, fixed: true },
    h(Path, { d: orangePath, fill: ORANGE, opacity: 0.55 }),
    h(Path, { d: navyPath, fill: NAVY })
  );
}

function LetterheadChrome() {
  return [
    h(Image, { key: "watermark", src: ICON_SRC, style: styles.watermark, fixed: true }),
    h(TopFlourish, { key: "top" }),
    h(Image, { key: "logo", src: LOGO_SRC, style: styles.headerLogo, fixed: true }),
    h(BottomFlourish, { key: "bottom" }),
    h(View, { key: "rule", style: styles.footerRule, fixed: true }),
    h(
      View,
      { key: "footer", style: styles.footerRow, fixed: true },
      h(Text, { style: styles.footerLabel }, LETTERHEAD_CONTACT.phone),
      h(Text, { style: styles.footerLabel }, LETTERHEAD_CONTACT.email)
    ),
    h(Text, { key: "website", style: styles.footerWebsite, fixed: true }, LETTERHEAD_CONTACT.website),
    h(Text, {
      key: "pageno",
      style: styles.pageNumber,
      fixed: true,
      render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`,
    }),
  ];
}

function ProductEntry(product) {
  return h(
    View,
    { key: product.slug, style: styles.product, wrap: false },
    h(Text, { style: styles.productName }, product.name),
    h(Text, { style: styles.productShort }, product.short),
    product.forms.length > 0
      ? h(
          Text,
          { style: styles.productForms },
          h(Text, { style: styles.formsLabel }, "Available as: "),
          product.forms.join(", ")
        )
      : null
  );
}

function CategorySection(category, products) {
  if (products.length === 0) return null;
  return h(
    View,
    { key: category.slug },
    h(Text, { style: styles.categoryHeader }, category.title),
    ...products.map(ProductEntry)
  );
}

export function CatalogDocument({ company, categories, productsByCategory }) {
  const generatedOn = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const coverPage = h(
    Page,
    { size: "A4", style: styles.coverPage },
    LetterheadChrome(),
    h(Text, { style: styles.coverTag }, "PRODUCT CATALOGUE"),
    h(Text, { style: styles.coverTitle }, company.name),
    h(Text, { style: styles.coverSubtitle }, company.tagline),
    h(Text, { style: styles.coverMeta }, `Generated ${generatedOn}`),
    h(
      Text,
      { style: styles.coverMeta },
      "Specifications are indicative — please confirm details for your specific requirement."
    )
  );

  const productPage = h(
    Page,
    { size: "A4", style: styles.page },
    LetterheadChrome(),
    ...categories.map((category) => CategorySection(category, productsByCategory[category.slug] || []))
  );

  return h(
    Document,
    { title: `${company.shortName} — Product Catalogue`, author: company.name },
    coverPage,
    productPage
  );
}

export default CatalogDocument;
