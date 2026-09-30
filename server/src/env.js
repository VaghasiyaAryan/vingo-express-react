/**
 * Environment normalisation.
 *
 * Imported first by `index.js`, before anything that reads `process.env` at
 * module load — `shared/content.js` resolves SITE_URL the moment it is
 * evaluated, so the aliasing below has to happen before it is imported.
 *
 * The aliases exist so an existing Next.js/Vercel `.env` keeps working
 * unchanged: `NEXT_PUBLIC_SITE_URL` still names the canonical site URL, and
 * Neon/Vercel Postgres' own connection-string variables still name the
 * database.
 */

const ALIASES = {
  SITE_URL: ["NEXT_PUBLIC_SITE_URL"],
  DATABASE_URL: ["POSTGRES_PRISMA_URL", "POSTGRES_URL", "DATABASE_URL_UNPOOLED"],
};

for (const [canonical, fallbacks] of Object.entries(ALIASES)) {
  if (process.env[canonical]) continue;
  const hit = fallbacks.find((name) => process.env[name]);
  if (hit) process.env[canonical] = process.env[hit];
}

/** Names that must be set for the server to be useful, and why. */
const REQUIRED = [
  ["DATABASE_URL", "products and enquiries cannot be read or written"],
  ["ADMIN_PASSWORD", "the admin dashboard is disabled"],
];

export function reportMissingEnv() {
  const missing = REQUIRED.filter(([name]) => !process.env[name]);
  for (const [name, consequence] of missing) {
    console.warn(`[env] ${name} is not set — ${consequence}.`);
  }
  return missing.map(([name]) => name);
}
