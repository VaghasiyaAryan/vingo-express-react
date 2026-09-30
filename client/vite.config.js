import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");

/** Where `npm run dev` forwards API calls. Must match the Express server's port. */
const apiTarget = process.env.VITE_API_TARGET || "http://localhost:4000";

/**
 * Everything the Express server owns, proxied through the dev server so the
 * browser sees one origin. That matters for more than convenience: the admin
 * session cookie is httpOnly + SameSite=Lax, so a cross-origin dev setup
 * would silently drop it on every admin request.
 */
const proxied = ["/api", "/sitemap.xml", "/robots.txt", "/manifest.webmanifest", "/manifest.json"];

export default defineConfig({
  plugins: [react()],

  // Artwork lives in the repository-root public/ folder, shared verbatim with
  // the Next.js app — one copy of every image, served at / in dev and copied
  // into dist/ on build.
  publicDir: path.join(projectRoot, "public"),

  resolve: {
    alias: {
      "@": path.join(here, "src"),
      "@shared": path.join(projectRoot, "shared"),
    },
  },

  server: {
    port: 5173,
    // shared/ sits outside this package's root, so Vite needs permission to
    // read it.
    fs: { allow: [projectRoot] },
    proxy: Object.fromEntries(proxied.map((route) => [route, { target: apiTarget, changeOrigin: false }])),
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Enough to debug a production issue without shipping the sources.
    sourcemap: false,
  },
});
