// `env.js` first, and by itself: it normalises SITE_URL before anything that
// reads it at module-evaluation time (shared/content.js does exactly that).
import { reportMissingEnv } from "./env.js";

import { createApp } from "./app.js";
import { clientDist, isProduction, port } from "./config.js";
import { prisma } from "./prisma.js";

reportMissingEnv();

const app = createApp();
const server = app.listen(port, () => {
  console.log(`VinGo API listening on http://localhost:${port}`);
  console.log(`  mode        ${isProduction ? "production" : "development"}`);
  console.log(`  client dist ${clientDist}`);
  if (!isProduction) {
    console.log("  In development, open the Vite dev server instead — it proxies /api here.");
  }
});

/** Finish in-flight requests, then let the database pool go. */
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down.`);
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
  // Don't hang forever on a stuck connection.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
