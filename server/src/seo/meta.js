import { prisma } from "../prisma.js";
import { businessCard, businessCardName, company, faqs, productCategories } from "../../../shared/content.js";

/**
 * Per-route document metadata, resolved on the server.
 *
 * A React SPA hands crawlers an empty shell, so everything a search engine or
 * a link unfurler reads — title, description, canonical, Open Graph, JSON-LD —
 * is resolved here from the request path and stamped into index.html before it
 * is sent. React then renders the same page's body client-side.
 */

const BASE = company.websiteUrl;

const SITE_DESCRIPTION =
  "VinGo International Pvt Ltd is a food ingredient exporter based in India, supplying premium dehydrated fruits, vegetables, fruit and vegetable powders, and instant food mixes to bulk buyers worldwide. Request a quotation today.";

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

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: company.name,
  url: BASE,
  logo: `${BASE}/logo.svg`,
  telephone: company.phoneDisplay,
  email: company.email,
  description:
    "Exporter of dehydrated fruits, dehydrated vegetables, fruit and vegetable powders, and dehydrated instant food mixes.",
  address: { "@type": "PostalAddress", addressCountry: "IN" },
};

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
    title: `${company.name} — Dehydrated Fruits, Vegetables & Powders Exporter`,
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
      image: `${BASE}/logo.svg`,
    },
    twitter: null,
    jsonLd: [],
  };
}

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

async function productMeta(slug) {
  const product = await prisma.product.findFirst({ where: { slug, active: true } });
  if (!product) return notFoundMeta();

  const category = productCategories.find((c) => c.slug === product.category);
  const url = `${BASE}/products/${product.slug}`;
  const title = titled(`${product.name} Supplier & Exporter from India`);

  return {
    ...defaults(),
    title,
    description: product.short,
    canonical: url,
    openGraph: {
      // Open Graph has no "product" type that unfurlers act on. The Product
      // JSON-LD below carries that semantic signal instead, which is what
      // search engines actually key off.
      type: "website",
      url,
      siteName: company.shortName,
      title,
      description: product.short,
      image: product.image || `${BASE}/logo.svg`,
    },
    twitter: { card: "summary", title, description: product.short },
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        category: category?.title,
        url,
        brand: { "@type": "Brand", name: company.shortName },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE },
          { "@type": "ListItem", position: 2, name: "Products", item: `${BASE}/#products` },
          { "@type": "ListItem", position: 3, name: product.name, item: url },
        ],
      },
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
      image: `${BASE}/logo.svg`,
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
  const path = pathname.replace(/\/+$/, "") || "/";

  try {
    if (path === "/") return { ...defaults(), jsonLd: [organizationLd, faqLd] };
    if (path === "/card") return cardMeta();

    if (path === "/admin" || path.startsWith("/admin/")) {
      return { ...defaults(), title: titled("Admin"), canonical: null, robots: NOINDEX, jsonLd: [] };
    }

    const legal = LEGAL_PAGES[path];
    if (legal) {
      const url = `${BASE}${path}`;
      const title = titled(legal.title);
      return {
        ...defaults(),
        title,
        description: legal.description,
        canonical: url,
        openGraph: { ...defaults().openGraph, url, title, description: legal.description },
        jsonLd: [],
      };
    }

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
