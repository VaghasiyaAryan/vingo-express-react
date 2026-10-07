import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// GoDaddy's hosting network blocks outbound TCP on port 5432, so plain Prisma
// reports "Can't reach database server" there. Neon's serverless driver runs
// the same queries over a WebSocket on port 443, which is allowed everywhere.
neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon(new Pool({ connectionString: process.env.DATABASE_URL }));

// GoDaddy's Alpine/musl runtime has no `openssl` CLI, so Prisma's libssl
// detection fails and falls back to the OpenSSL 1.1 engine, which that
// OpenSSL-3-only image cannot load. The right engine is bundled (see
// binaryTargets in schema.prisma) — point Prisma at it directly.
if (process.platform === "linux" && !process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const generated = path.join(here, "../node_modules/.prisma/client");
  try {
    const engine = fs
      .readdirSync(generated)
      .find((f) => f.startsWith("libquery_engine-linux-musl-openssl-3") && f.endsWith(".so.node"));
    if (engine) process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(generated, engine);
  } catch {
    // Client not generated yet — let Prisma's own detection run.
  }
}

// A single client for the process. Kept on globalThis in development so
// `node --watch` restarts reuse the pool instead of opening a new one per
// reload until Postgres refuses connections.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__vingoPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__vingoPrisma = prisma;
}
