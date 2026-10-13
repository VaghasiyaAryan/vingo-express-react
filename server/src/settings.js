import { prisma } from "./prisma.js";
import { clean } from "./util.js";
import { hero } from "../../shared/content.js";

// The key predates the product links, when only the label text was stored.
const HERO_ITEMS_KEY = "heroFloatingLabels";
export const HERO_ITEM_COUNT = hero.floatingProducts.length;
export const HERO_LABEL_MAX_LENGTH = 40;
const SLUG = /^[a-z0-9-]{1,100}$/;

/**
 * Reads a stored value into [{ label, slug }]. Older saves are plain strings —
 * a default label keeps its default product; anything else gets no product
 * and links to the full catalogue.
 */
function normalize(value) {
  if (!Array.isArray(value) || value.length !== HERO_ITEM_COUNT) return null;
  const items = value.map((v) =>
    typeof v === "string"
      ? { label: v, slug: hero.floatingProducts.find((d) => d.label === v)?.slug ?? "" }
      : { label: typeof v?.label === "string" ? v.label : "", slug: typeof v?.slug === "string" ? v.slug : "" }
  );
  return items.every((item) => item.label) ? items : null;
}

/**
 * The four buttons floating around the homepage logo, exactly as saved. Falls
 * back to the defaults in shared/content.js when nothing has been saved yet —
 * or when the SiteSetting table has not been created (`npm run db:push`), so
 * the homepage never breaks over a missing table.
 */
export async function getHeroItems() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: HERO_ITEMS_KEY } });
    const saved = normalize(row?.value);
    if (saved) return saved;
  } catch (err) {
    // P2021: table does not exist.
    if (err?.code !== "P2021") throw err;
  }
  return hero.floatingProducts;
}

/**
 * What the public homepage gets: a button whose product has since been hidden
 * or deleted links to the catalogue instead of a 404.
 */
export async function getPublicHeroItems() {
  const items = await getHeroItems();
  const slugs = items.map((item) => item.slug).filter(Boolean);
  if (slugs.length === 0) return items;

  const live = await prisma.product.findMany({ where: { slug: { in: slugs }, active: true }, select: { slug: true } });
  const liveSlugs = new Set(live.map((p) => p.slug));
  return items.map((item) => (liveSlugs.has(item.slug) ? item : { ...item, slug: "" }));
}

/** Returns the cleaned items, or null unless there are exactly four, each with a label and a valid (or empty) slug. */
export function parseHeroItems(value) {
  if (!Array.isArray(value) || value.length !== HERO_ITEM_COUNT) return null;
  const items = value.map((v) => ({ label: clean(v?.label, HERO_LABEL_MAX_LENGTH), slug: clean(v?.slug, 100) }));
  return items.every((item) => item.label && (item.slug === "" || SLUG.test(item.slug))) ? items : null;
}

export async function saveHeroItems(items) {
  await prisma.siteSetting.upsert({
    where: { key: HERO_ITEMS_KEY },
    create: { key: HERO_ITEMS_KEY, value: items },
    update: { value: items },
  });
  return items;
}
