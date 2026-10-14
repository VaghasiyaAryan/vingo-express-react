// Points every product that has no photo yet at its bundled web photo
// (public/products/<slug>.webp), if one exists. Products that already have an
// image — e.g. one uploaded in Admin → Products — are never touched.
//
//   node --env-file=../.env.local scripts/use-bundled-photos.js
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/prisma.js";
import { publicDir } from "../src/config.js";

const products = await prisma.product.findMany({ select: { id: true, slug: true, image: true } });
let set = 0;
for (const p of products) {
  const file = path.join(publicDir, "products", `${p.slug}.webp`);
  if (p.image || !fs.existsSync(file)) {
    console.log(`skip  ${p.slug}${p.image ? ` (already has ${p.image})` : " (no bundled photo)"}`);
    continue;
  }
  await prisma.product.update({ where: { id: p.id }, data: { image: `/products/${p.slug}.webp` } });
  console.log(`set   ${p.slug} -> /products/${p.slug}.webp`);
  set++;
}
console.log(`\n${set} of ${products.length} products now use their bundled photo.`);
await prisma.$disconnect();
