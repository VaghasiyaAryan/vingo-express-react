/* ============================================================================
 * VinGo International — EDIT ALL WEBSITE TEXT HERE
 * ----------------------------------------------------------------------------
 * Confirmed by the owner: company name, phone number, website domain, email,
 * the homepage stats and the export markets list. Anything still marked
 * [PLACEHOLDER] below is sample wording to review.
 * ==========================================================================*/

// Canonical production URL — every canonical link, Open Graph tag, JSON-LD
// URL and the sitemap derives from this single value.
//
// This module is imported by BOTH the Express server and the React client, so
// it reads whichever environment it happens to be running in: SITE_URL from
// the server's process env, VITE_SITE_URL from the client bundle.
function resolveSiteUrl() {
  if (typeof process !== "undefined" && process.env && process.env.SITE_URL) {
    return process.env.SITE_URL;
  }
  try {
    if (import.meta && import.meta.env && import.meta.env.VITE_SITE_URL) {
      return import.meta.env.VITE_SITE_URL;
    }
  } catch {
    // `import.meta` is unavailable in a CommonJS context — fall through.
  }
  return "https://www.vingointernational.com";
}

const SITE_URL = resolveSiteUrl().replace(/\/$/, "");

export const company = {
  name: "VinGo International Pvt Ltd",
  shortName: "VinGo International",
  tagline: "Dehydrated Foods, Delivered Worldwide",
  phoneDisplay: "+91 93132 51136",
  phoneHref: "+919313251136",
  whatsappNumber: "919313251136", // digits only, country code first
  website: SITE_URL.replace(/^https?:\/\//, ""),
  websiteUrl: SITE_URL,
  email: "hello@vingointernational.com",
  address: "Surat, Gujarat, India",
};

export const social = {
  instagram: "https://www.instagram.com/vingo.international/",
  facebook: "https://www.facebook.com/people/Vingo-International/61593469176427/",
  // Not a company page yet — it opens the LinkedIn feed. Kept as the owner
  // chose, but left out of the structured data's `sameAs` (see server/src/seo/meta.js).
  linkedin: "https://www.linkedin.com/feed/",
  twitter: "https://x.com/VingoGlobal",
};

/** Social profiles that are genuinely this company's — used as schema.org `sameAs`. */
export const officialProfiles = [social.instagram, social.facebook, social.twitter];

export const whatsappDefaultMessage =
  "Hello VinGo International, I would like to enquire about your dehydrated food products.";

export function whatsappLink(message = whatsappDefaultMessage) {
  return `https://wa.me/${company.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(subject, body) {
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${company.email}${params.length ? `?${params.join("&")}` : ""}`;
}

/** WhatsApp + email deep-links for requesting a quotation on a specific product. Shared by the product grid and each product's own page. */
export function quoteWhatsappLink(productName) {
  return whatsappLink(
    `Hello VinGo International, I would like a quotation for ${productName}. Please share specifications and pricing.`
  );
}

export function quoteMailtoLink(productName) {
  return mailtoLink(
    `Quotation request — ${productName}`,
    `Hello VinGo International,\n\nPlease share a quotation for ${productName}, including pricing, specifications and packaging options.\n\nThank you.`
  );
}

export const hero = {
  eyebrow: "Exporters of Premium Dehydrated Foods",
  title: "Farm-fresh produce,",
  titleAccent: "dehydrated to perfection",
  subtitle:
    "VinGo International supplies dehydrated fruits and vegetables, fruit and vegetable powders, and ready-to-cook instant food mixes to food manufacturers, distributors and retailers across the globe.",
  stats: [
    { value: "20+", label: "Product Varieties" },
    { value: "15+", label: "Countries Served" },
    { value: "100%", label: "Quality Checked" },
    { value: "24h", label: "Quote Turnaround" },
  ],
  // The four buttons floating around the logo, each opening a product page
  // (an empty slug opens the full catalogue). These are only the defaults —
  // once saved from Admin → Homepage, the database copy wins.
  floatingProducts: [
    { label: "Mango Powder", slug: "mango-powder" },
    { label: "Onion Flakes", slug: "white-onion" },
    { label: "Instant Khichdi", slug: "khichdi-mix" },
    { label: "Beetroot Powder", slug: "beetroot-powder" },
  ],
};

export const about = {
  title: "Rooted in quality, built for global trade",
  // [PLACEHOLDER] Rewrite this in your own words — your real story converts best.
  paragraphs: [
    "VinGo International Pvt Ltd is an India-based processor and exporter of dehydrated food ingredients. We work directly with farming clusters to source seasonal produce at peak ripeness, then dehydrate it under controlled conditions that lock in colour, aroma and nutrition.",
    "From single-ingredient flakes and powders to custom instant food blends, we supply consistent, specification-matched batches — backed by documentation, dependable lead times and packaging built for long international transit.",
  ],
  highlights: [
    "Direct-from-farm sourcing",
    "Controlled-condition dehydration",
    "Batch-wise quality checks",
    "Export-ready documentation",
  ],
};

export const productCategories = [
  {
    slug: "dehydrated-fruits",
    icon: "apple",
    title: "Dehydrated Fruits",
    description:
      "Sun-ripened fruit dried into slices, dices, flakes and granules — natural sweetness and colour retained, no rehydration required for most applications.",
    items: ["Banana", "Mango", "Pineapple", "Papaya", "Apple", "Guava"],
  },
  {
    slug: "dehydrated-vegetables",
    icon: "carrot",
    title: "Dehydrated Vegetables",
    description:
      "Consistently cut and dried vegetables for soups, seasonings, ready meals, snacks and institutional kitchens, available in multiple mesh and cut sizes.",
    items: ["Onion", "Garlic", "Tomato", "Carrot", "Beetroot", "Green Peas"],
  },
  {
    slug: "fruit-vegetable-powders",
    icon: "sparkles",
    title: "Fruit & Vegetable Powders",
    description:
      "Finely milled spray-dried and air-dried powders for beverages, bakery, nutraceuticals, baby food and natural colouring — uniform particle size, clean flavour.",
    items: ["Mango Powder", "Banana Powder", "Onion Powder", "Garlic Powder", "Beetroot Powder", "Spinach Powder"],
  },
  {
    slug: "instant-food",
    icon: "soup",
    title: "Dehydrated Instant Foods",
    description:
      "Ready-to-cook and just-add-water blends — instant soups, khichdi, upma, poha and meal mixes formulated for shelf stability and quick preparation.",
    items: ["Instant Soups", "Khichdi Mix", "Upma Mix", "Poha Mix", "Meal Kits", "Camping Meals"],
  },
  {
    slug: "custom-blends",
    icon: "blend",
    title: "Custom & Private Label",
    description:
      "Your specification, our processing line. Custom cuts, mesh sizes, seasoning blends and private-label packaging for importers and own-brand programmes.",
    items: ["Custom Blends", "Private Label", "Bulk Packing", "Retail Packs", "OEM Supply", "Sample Development"],
  },
];

// [PLACEHOLDER] These are generic strength statements, NOT certification claims.
// Add your actual certifications (FSSAI, APEDA, ISO, HACCP, Organic, etc.) only
// once they are issued — false certification claims create real legal exposure.
export const whyChooseUs = [
  {
    icon: "shield",
    title: "Quality-First Processing",
    description:
      "Incoming produce, in-process batches and finished goods are checked against agreed specifications before dispatch.",
  },
  {
    icon: "globe",
    title: "Export-Ready Operations",
    description:
      "Documentation, labelling and packaging prepared to match destination-market requirements and buyer checklists.",
  },
  {
    icon: "leaf",
    title: "Direct Farm Sourcing",
    description:
      "Sourcing relationships close to the growing clusters mean better raw material, fresher intake and steadier pricing.",
  },
  {
    icon: "package",
    title: "Flexible Order Sizes",
    description:
      "From trial samples and LCL consignments through to full container loads, with packaging matched to your handling setup.",
  },
  {
    icon: "clock",
    title: "Reliable Lead Times",
    description:
      "Production planned against your delivery window, with clear updates from confirmation through to shipment.",
  },
  {
    icon: "headset",
    title: "Responsive Support",
    description:
      "One point of contact on WhatsApp and email for specifications, samples, pricing and shipment tracking.",
  },
];

export const processSteps = [
  {
    step: "01",
    title: "Sourcing",
    description: "Seasonal produce selected at peak maturity from mapped farming clusters.",
  },
  {
    step: "02",
    title: "Cleaning & Prep",
    description: "Washing, sorting, peeling and precision cutting to the required cut size.",
  },
  {
    step: "03",
    title: "Dehydration",
    description: "Controlled temperature and airflow drying that protects colour, aroma and nutrients.",
  },
  {
    step: "04",
    title: "Quality Check",
    description: "Moisture, colour, mesh size and sensory checks verified against your specification.",
  },
  {
    step: "05",
    title: "Packing",
    description: "Food-grade liners and cartons or bulk bags, sealed for long-haul transit.",
  },
  {
    step: "06",
    title: "Export",
    description: "Documentation, customs coordination and dispatch to your nominated port.",
  },
];

// The markets the business ships to — also published as `areaServed` in the
// LocalBusiness structured data, so keep it accurate.
export const globalMarkets = [
  "United States",
  "United Kingdom",
  "Germany",
  "Netherlands",
  "United Arab Emirates",
  "Saudi Arabia",
  "Australia",
  "Canada",
  "Singapore",
  "Malaysia",
  "South Africa",
  "Japan",
];

// Client testimonials, shown on the About page. Empty on purpose: the
// section stays hidden until there are genuine, permission-granted quotes.
// To add one: { quote: "…", name: "Jane Doe", role: "Procurement Head, Company" }
export const testimonials = [];

export const faqs = [
  {
    q: "What is your minimum order quantity?",
    a: "MOQ depends on the product and packaging format. We support trial samples, LCL part-container orders and full container loads — share your requirement and we will confirm the workable minimum.",
  },
  {
    q: "Can you supply samples before a bulk order?",
    a: "Yes. Samples with specification sheets can be arranged for evaluation before you commit to a bulk consignment.",
  },
  {
    q: "Do you offer private label and custom blends?",
    a: "Yes. We produce to buyer specification including custom cuts, mesh sizes, seasoning blends and private-label retail or bulk packaging.",
  },
  {
    q: "Which packaging options are available?",
    a: "Food-grade inner liners with export cartons, bulk bags, and retail packs. Packaging is matched to your handling, shelf-life and labelling requirements.",
  },
  {
    q: "How quickly will I get a quotation?",
    a: "Send your product, quantity and destination port through the enquiry form or WhatsApp and we will respond with a quotation, typically within one working day.",
  },
];

// Shown in the enquiry form's "Required quantity" dropdown. Edit freely —
// the last option reveals a free-text box so buyers can state anything else.
export const quantityOptions = [
  "Samples only (for evaluation)",
  "Under 500 kg",
  "500 kg – 1 MT",
  "1 – 5 MT",
  "5 – 10 MT",
  "10 – 20 MT (approx. 1 × 20ft container)",
  "20 – 40 MT (approx. 1 × 40ft container)",
  "40+ MT / multiple containers",
  "Recurring monthly supply",
  "Not sure yet — need guidance",
  "Other (specify)",
];

export const orderFrequencyOptions = ["One-time order", "Monthly", "Quarterly", "Annual contract"];

export const productInterestOptions = [
  "Dehydrated Fruits",
  "Dehydrated Vegetables",
  "Fruit & Vegetable Powders",
  "Dehydrated Instant Foods",
  "Custom / Private Label",
  "Multiple Categories",
];

/* ============================================================================
 * DIGITAL BUSINESS CARD  →  /card
 * ----------------------------------------------------------------------------
 * A phone-sized "tap to save my contact" card, meant to be shared as a link or
 * QR code. Everything below feeds both the on-screen card and the downloadable
 * .vcf file served from /api/vcard — edit here and both stay in sync.
 *
 * Photo: drop a square image (600×600 or larger) at public/card/avatar.jpg and
 * set `photo: "/card/avatar.jpg"`. Left null, the card shows the initials mark.
 * ==========================================================================*/
export const businessCard = {
  // [PLACEHOLDER] Whose card this is.
  firstName: "Aryan",
  lastName: "Vaghasiya",
  role: "Founder & Export Head",
  organization: company.shortName,
  photo: null,

  // [PLACEHOLDER] One line that sounds like the person, not the brochure.
  quote: "Every shipment carries our name — so it carries our standard.",

  // Contact rails. Default to the company details; override any line with a
  // personal number or inbox when the card belongs to a specific team member.
  phoneDisplay: company.phoneDisplay,
  phoneHref: company.phoneHref,
  email: company.email,
  whatsappNumber: company.whatsappNumber,
  website: company.website,
  websiteUrl: company.websiteUrl,
  address: company.address,
};

/** "Aryan Vaghasiya" — used for the heading, the vCard FN field and the share sheet. */
export const businessCardName = `${businessCard.firstName} ${businessCard.lastName}`.trim();

/** "AV" — fallback avatar when no photo is set. */
export const businessCardInitials = `${businessCard.firstName.charAt(0)}${businessCard.lastName.charAt(0)}`.toUpperCase();
