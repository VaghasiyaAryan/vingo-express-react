import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** server/ — the package root, one level up from src/. */
export const serverRoot = path.resolve(here, "..");

/** The repository root, which also holds prisma/, shared/, public/ and client/. */
export const projectRoot = path.resolve(serverRoot, "..");

export const isProduction = process.env.NODE_ENV === "production";

export const port = Number(process.env.PORT) || 4000;

/**
 * The built React app. In production Express serves this directly (and
 * injects per-route meta into its index.html). In development it usually
 * does not exist — Vite serves the client on its own port and proxies the
 * API here — so its absence is not an error.
 */
export const clientDist = process.env.CLIENT_DIST
  ? path.resolve(projectRoot, process.env.CLIENT_DIST)
  : path.join(projectRoot, "client", "dist");

/**
 * Static assets (logo, product photos). Shared verbatim with the Next.js app
 * so there is exactly one copy of every image in the repository.
 */
export const publicDir = path.join(projectRoot, "public");

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.INQUIRY_NOTIFY_TO);

export const uploadsConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
