// One-time / disaster-recovery seed: populates the Product table from the
// original static catalogue in prisma/seedData.cjs. No-ops if the table
// already has rows, so it is safe to re-run and never clobbers edits made
// through the admin dashboard.
//
// Run with: npm run seed
import "../src/env.js";

import { createRequire } from "node:module";
import { prisma } from "../src/prisma.js";

// prisma/seedData.cjs is CommonJS, so it needs require rather than import.
const require = createRequire(import.meta.url);
const products = require("../prisma/seedData.cjs");

async function main() {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log(
      `Product table already has ${existing} row(s) — skipping seed. Delete them first if you want to reseed.`
    );
    return;
  }

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    await prisma.product.create({
      data: {
        slug: p.slug,
        category: p.category,
        name: p.name,
        image: p.image,
        form: p.form,
        colors: p.colors,
        short: p.short,
        description: p.description,
        forms: p.forms,
        applications: p.applications,
        specs: p.specs,
        active: true,
        sortOrder: i,
      },
    });
  }

  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
