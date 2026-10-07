import path from "node:path";

import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";

import { clientDist, isProduction, publicDir } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { inquiryRouter } from "./routes/inquiry.js";
import { productsRouter } from "./routes/products.js";
import { catalogRouter } from "./routes/catalog.js";
import { vcardRouter } from "./routes/vcard.js";
import { adminRouter } from "./routes/admin/index.js";
import { wellKnownRouter } from "./seo/wellKnown.js";
import { serveApp } from "./seo/render.js";

export function createApp() {
  const app = express();

  // Behind a reverse proxy (Nginx, Render, Fly, a CDN) req.ip and the secure
  // cookie flag are only correct once X-Forwarded-* is trusted.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // ------------------------------------------------------------------ API
  app.use("/api/auth", authRouter);
  app.use("/api/inquiry", inquiryRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/catalog", catalogRouter);
  app.use("/api/vcard", vcardRouter);
  app.use("/api/admin", adminRouter);

  // Anything else under /api is a genuine 404 — never let it fall through to
  // the SPA shell, or a typo'd fetch resolves with a 200 and a page of HTML.
  app.use("/api", (req, res) => {
    res.status(404).json({ error: `No API route for ${req.method} ${req.baseUrl}${req.path}` });
  });

  // -------------------------------------------------------- crawler files
  app.use(wellKnownRouter);

  // ------------------------------------------------------- static assets
  // The built React bundle. `index: false` so the SPA shell always goes
  // through serveApp below, which is what injects the per-route <head>.
  //
  // Vite writes content-hashed filenames into dist/assets/, so anything from
  // there can be cached forever — a change produces a new filename. The rest
  // of dist/ is the artwork copied out of public/, which keeps its name across
  // deploys and therefore has to be revalidated.
  app.use(
    express.static(clientDist, {
      index: false,
      setHeaders(res, filePath) {
        if (!isProduction) {
          res.setHeader("Cache-Control", "no-store");
          return;
        }
        const hashed = filePath.includes(`${path.sep}assets${path.sep}`);
        res.setHeader(
          "Cache-Control",
          hashed ? "public, max-age=31536000, immutable" : "public, max-age=3600, must-revalidate"
        );
      },
    })
  );

  // The same artwork straight from the repository, so the logo and product
  // photos still resolve when dist/ has not been built yet.
  app.use(express.static(publicDir, { index: false, maxAge: isProduction ? "1h" : 0 }));

  // ----------------------------------------------------------- SPA shell
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    serveApp(req, res, next);
  });

  // -------------------------------------------------------- error handler
  app.use((err, req, res, next) => {
    console.error(`${req.method} ${req.originalUrl} failed:`, err);
    if (res.headersSent) {
      next(err);
      return;
    }
    const wantsJson = req.path.startsWith("/api");
    if (wantsJson) {
      res.status(500).json({ error: "Something went wrong on our side. Please try again." });
    } else {
      res.status(500).type("text/plain").send("Something went wrong on our side. Please try again.");
    }
  });

  return app;
}
