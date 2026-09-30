import { PrismaClient } from "@prisma/client";

// A single client for the process. Kept on globalThis in development so
// `node --watch` restarts reuse the pool instead of opening a new one per
// reload until Postgres refuses connections.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__vingoPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__vingoPrisma = prisma;
}
