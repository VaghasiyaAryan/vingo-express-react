import { prisma } from "../prisma.js";
import {
  businessCard,
  businessCardName,
  company,
  faqs,
  globalMarkets,
  officialProfiles,
  productCategories,
} from "../../../shared/content.js";

/**
 * Per-route document metadata, resolved on the server.
 *
 * A React SPA hands crawlers an empty shell, so everything a search engine or
 * a link unfurler reads — title, description, canonical, Open Graph, JSON-LD —
 * is resolved here from the request path and stamped into index.html before it
 * is sent. React then renders the same page's body client-side.
 */

const BASE = company.websiteUrl;

// Kept under ~155 characters so Google shows it in full instead of cutting it off.
const SITE_DESCRIPTION =
  "VinGo International exports dehydrated fruits, vegetables, fruit and vegetable powders and instant food mixes from India to bulk buyers worldwide.";

const KEYWORDS = [
  "food ingredient exporter India",
  "dehydrated food exporter India",
  "dehydrated fruits exporter",
  "dehydrated vegetables exporter",
  "fruit powder manufacturer",
  "vegetable powder exporter",
  "dehydrated instant food",
  "bulk food ingredient supplier",
  "VinGo International",
];

const NOINDEX = "noindex, nofollow";

/** "Privacy Policy" -> "Privacy Policy | VinGo International" */
function titled(pageTitle) {
  return `${pageTitle} | ${company.shortName}`;
}

/**
 * Social share image (1200×630 PNG — Facebook, WhatsApp, LinkedIn and X do not
 * render SVG previews). Generated from the logo; see public/og-image.png.
 */
const SHARE_IMAGE = {
  url: `${BASE}/og-image.png`,
  width: 1200,
  height: 630,
  alt: `${company.shortName} — exporter of dehydrated fruits, vegetables, powders and instant food mixes from India`,
};

/** "Surat, Gujarat, India" → locality + region. Only what the business has published — no street address is invented. */
const [addressLocality, addressRegion] = company.address.split(",").map((s) => s.trim());

const BUSINESS_ID = `${BASE}/#business`;

/**
 * LocalBusiness, not just Organization: it is what Google uses for the
 * business's knowledge panel and local results. Fields are limited to facts
 * the site already states — no opening hours, geo-coordinates or ratings are
 * made up.
 */
const localBusinessLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": BUSINESS_ID,
  name: company.name,
  alternateName: company.shortName,
  url: BASE,
  logo: `${BASE}/icon-512.png`,
  image: SHARE_IMAGE.url,
  description:
    "Exporter of dehydrated fruits, dehydrated vegetables, fruit and vegetable powders, and dehydrated instant food mixes from India.",
  telephone: company.phoneHref,
  email: company.email,
  address: { "@type": "PostalAddress", addressLocality, addressRegion, addressCountry: "IN" },
  areaServed: globalMarkets.map((name) => ({ "@type": "Country", name })),
  sameAs: officialProfiles,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "sales",
    telephone: company.phoneHref,
    email: company.email,
  },
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE}/#website`,
  name: company.shortName,
  url: BASE,
  inLanguage: "en",
  publisher: { "@id": BUSINESS_ID },
};

/** [["About Us", "/about"]] → BreadcrumbList starting at Home. */
function breadcrumbLd(trail) {
  const items = [["Home", ""], ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${BASE}${path}`,
    })),
  };
}

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

/** Every field the head renderer knows how to emit, with site-wide defaults. */
function defaults() {
  return {
    status: 200,
    // Under ~60 characters so search results show it whole. Mirrors defaultTitle() in the client.
    title: `Dehydrated Fruits & Vegetables Exporter | ${company.shortName}`,
    description: SITE_DESCRIPTION,
    keywords: KEYWORDS,
    canonical: BASE,
    robots: "index, follow",
    themeColor: "#2e2c75",
    openGraph: {
      type: "website",
      url: BASE,
      siteName: company.shortName,
      title: `${company.name} — Dehydrated Foods, Delivered Worldwide`,
      description:
        "Premium dehydrated fruits, vegetables, powders and instant food mixes for food manufacturers, distributors and retailers worldwide.",
      image: SHARE_IMAGE,
    },
    // Filled in from openGraph by withSocial() when not set explicitly.
    twitter: null,
    jsonLd: [],
  };
}

/**
 * Large-image X/Twitter card mirroring the Open Graph title, description and
 * image, so every shared link shows the same rich preview everywhere.
 */
function withSocial(meta) {
  const og = meta.openGraph;
  return {
    ...meta,
    twitter: meta.twitter ?? {
      card: "summary_large_image",
      site: "@VingoGlobal",
      title: og.title,
      description: og.description,
      image: og.image,
    },
  };
}

/** A standard page: its own title, description, canonical, share preview, breadcrumbs. */
function pageMeta(path, { title, description, crumb, jsonLd = [] }) {
  const url = `${BASE}${path}`;
  const fullTitle = titled(title);
  return {
    ...defaults(),
    title: fullTitle,
    description,
    canonical: url,
    openGraph: { ...defaults().openGraph, url, title: fullTitle, description },
    jsonLd: [...jsonLd, breadcrumbLd([[crumb ?? title, path]])],
  };
}

/** The main site pages besides the homepage. Titles match useDocumentTitle() in each client page. */
const SITE_PAGES = {
  "/about": {
    title: "About Us",
    description: `How ${company.shortName} sources, dehydrates and exports fruits, vegetables, powders and instant food mixes from India, and the markets we ship to.`,
  },
  "/products": {
    title: "Products",
    description:
      "Dehydrated fruits, dehydrated vegetables, fruit and vegetable powders and instant food mixes — supplied to your cut size, mesh and packaging specification.",
  },
  "/faq": {
    title: "Frequently Asked Questions",
    description: "Answers on samples, minimum order quantities, packaging, documentation and shipping for bulk buyers.",
    jsonLd: [faqLd],
  },
  "/contact": {
    title: "Contact Us",
    description: `Request a quotation or samples from ${company.shortName} — by enquiry form, phone, email or WhatsApp. We usually reply within one working day.`,
    jsonLd: [localBusinessLd],
  },
};

const LEGAL_PAGES = {
  "/privacy-policy": {
    title: "Privacy Policy",
    description: `How ${company.shortName} collects, uses and protects information submitted through this website.`,
  },
  "/terms-and-conditions": {
    title: "Terms & Conditions",
    description: `Terms governing use of the ${company.shortName} website and the enquiries submitted through it.`,
  },
  "/cookie-policy": {
    title: "Cookie Policy",
    description: `How ${company.shortName} uses cookies and similar technologies on this website.`,
  },
};

/** The product's one-liner plus a call to action, kept under ~160 characters. */
function productDescription(short) {
  const full = `${short} Bulk supply from India by ${company.shortName} — request specifications and a quote.`;
  if (full.length <= 160) return full;
  const brief = `${short} Bulk supply from India.`;
  return brief.length <= 160 ? brief : short.slice(0, 157).trimEnd() + "…";
}

async function productMeta(slug) {
  const product = await prisma.product.findFirst({ where: { slug, active: true } });
  if (!product) return notFoundMeta();

  const category = productCategories.find((c) => c.slug === product.category);
  const url = `${BASE}/products/${product.slug}`;
  const title = titled(`${product.name} Supplier & Exporter from India`);
  // The product's photo, absolute (uploads are stored as /api/images/:id), for
  // the Product structured data. Null when the product has no photo.
  const photo = product.image ? new URL(product.image, BASE).href : null;
  const description = productDescription(product.short);

  return {
    ...defaults(),
    title,
    description,
    canonical: url,
    openGraph: {
      // Open Graph has no "product" type that unfurlers act on. The Product
      // JSON-LD below carries that semantic signal instead, which is what
      // search engines actually key off.
      type: "website",
      url,
      siteName: company.shortName,
      title,
      description,
      // Always the PNG share image: product photos are WebP, which LinkedIn and
      // some WhatsApp versions do not show as link previews.
      image: SHARE_IMAGE,
    },
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        category: category?.title,
        url,
        // Only a genuine photo of the product — never the generic share image.
        ...(photo ? { image: photo } : {}),
        brand: { "@type": "Brand", name: company.shortName },
        manufacturer: { "@id": BUSINESS_ID },
      },
      breadcrumbLd([
        ["Products", "/products"],
        [product.name, `/products/${product.slug}`],
      ]),
    ],
  };
}

function cardMeta() {
  return {
    ...defaults(),
    title: `${businessCardName} — ${businessCard.organization}`,
    description: `Digital business card for ${businessCardName}, ${businessCard.role} at ${company.name}. Tap to call, email or save the contact.`,
    canonical: `${BASE}/card`,
    // A card is handed out by link or QR code, not found through search —
    // keeping it out of the index also keeps a personal number off search
    // results pages. Flip to "index, follow" to make it discoverable.
    robots: NOINDEX,
    // The card fills the phone screen, so the browser chrome should blend into
    // the white top of the card rather than the site-wide navy.
    themeColor: "#ffffff",
    openGraph: {
      type: "profile",
      url: `${BASE}/card`,
      siteName: company.shortName,
      title: `${businessCardName} — ${businessCard.role}`,
      description: `${businessCard.organization} · ${company.tagline}`,
      image: SHARE_IMAGE,
    },
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Person",
        name: businessCardName,
        jobTitle: businessCard.role,
        telephone: businessCard.phoneDisplay,
        email: businessCard.email,
        url: businessCard.websiteUrl,
        worksFor: { "@type": "Organization", name: company.name, url: BASE },
      },
    ],
  };
}

function notFoundMeta() {
  return {
    ...defaults(),
    status: 404,
    title: titled("Page Not Found"),
    description: "The page you are looking for does not exist or may have moved.",
    canonical: null,
    robots: NOINDEX,
    jsonLd: [],
  };
}

const PRODUCT_PATH = /^\/products\/([a-z0-9-]+)$/i;

/** Resolves metadata for a request path. Never throws — falls back to site defaults. */
export async function resolveMeta(pathname) {
  return withSocial(await resolveBase(pathname));
}

async function resolveBase(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";

  try {
    if (path === "/") return { ...defaults(), jsonLd: [localBusinessLd, websiteLd] };
    if (path === "/card") return cardMeta();

    if (path === "/admin" || path.startsWith("/admin/")) {
      return { ...defaults(), title: titled("Admin"), canonical: null, robots: NOINDEX, jsonLd: [] };
    }

    const page = SITE_PAGES[path] ?? LEGAL_PAGES[path];
    if (page) return pageMeta(path, page);

    const productMatch = path.match(PRODUCT_PATH);
    if (productMatch) return await productMeta(productMatch[1]);

    return notFoundMeta();
  } catch (err) {
    // A database hiccup must never stop the page being served — the React app
    // still renders, just with the site-wide defaults in <head>.
    console.error("Failed to resolve page metadata:", err);
    return defaults();
  }
}
