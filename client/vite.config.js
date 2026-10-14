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
const proxied = ["/api", "/sitemap.xml", "/robots.txt", "/llms.txt", "/manifest.webmanifest", "/manifest.json"];

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
    port: 8080,
    // shared/ sits outside this package's root, so Vite needs permission to
    // read it.
    fs: { allow: [projectRoot] },
    proxy: Object.fromEntries(proxied.map((route) => [route, { target: apiTarget, changeOrigin: false }])),
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    // No source maps in production: the original source is not published.
    sourcemap: false,
    // Flags stay separate files, fetched only when the country picker shows
    // them. By default Vite inlines files under 4 KB into the JavaScript, which
    // would put ~170 flags inside the Contact page's code.
    assetsInlineLimit: (file) => (file.includes("flag-icons") ? false : undefined),
    rollupOptions: {
      output: {
        // Libraries change far less often than the site's own code. In their
        // own files they stay cached in visitors' browsers across deploys, so
        // a content or styling change only re-downloads the small app chunk.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return "vendor";
          if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return "animation";
          return undefined;
        },
      },
    },
  },
});
