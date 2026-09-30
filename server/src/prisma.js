import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

// GoDaddy's Alpine/musl runtime container has no `openssl` CLI in PATH, so
// Prisma's own libssl-version auto-detection fails and it silently defaults
// to the legacy openssl-1.1.x musl engine — which doesn't exist on this
// OpenSSL-3-only image (see PrismaClientInitializationError in prod logs:
// "Error loading shared library libssl.so.1.1: No such file or directory").
// The correct engine *is* bundled (schema.prisma's binaryTargets includes
// linux-musl-openssl-3.0.x), detection just never picks it. Point Prisma at
// it directly, bypassing detection, whenever that file is present.
if (!process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const prismaClientDir = path.join(__dirname, "../node_modules/.prisma/client");
  try {
    const engineFile = fs
      .readdirSync(prismaClientDir)
      .find((f) => f.startsWith("libquery_engine-linux-musl-openssl-") && f.endsWith(".so.node"));
    if (engineFile) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(prismaClientDir, engineFile);
    }
  } catch {
    // .prisma/client not generated yet — let Prisma's normal detection run.
  }
}

// A single client for the process. Kept on globalThis in development so
// `node --watch` restarts reuse the pool instead of opening a new one per
// reload until Postgres refuses connections.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__vingoPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__vingoPrisma = prisma;
}
