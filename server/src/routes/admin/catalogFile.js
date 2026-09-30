import { Router } from "express";
import { del } from "@vercel/blob";
import { prisma } from "../../prisma.js";
import { asyncRoute, clean } from "../../util.js";
import { uploadsConfigured } from "../../config.js";

export const adminCatalogFileRouter = Router();

const CATALOG_FILE_ID = "catalog";

adminCatalogFileRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const file = await prisma.catalogFile.findUnique({ where: { id: CATALOG_FILE_ID } });
    res.json({ file });
  })
);

/**
 * Issues a short-lived client token so the browser can upload the catalogue
 * PDF directly to Blob storage — same pattern as product photo uploads.
 */
adminCatalogFileRouter.post(
  "/upload-token",
  asyncRoute(async (req, res) => {
    if (!uploadsConfigured()) {
      res.status(503).json({
        error: "File uploads are not configured — set BLOB_READ_WRITE_TOKEN.",
      });
      return;
    }

    const { handleUpload } = await import("@vercel/blob/client");

    try {
      const jsonResponse = await handleUpload({
        body: req.body,
        request: req,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
        }),
        // Required by the Blob client, but nothing to record here — the
        // browser gets the URL back directly and posts it to us below.
        onUploadCompleted: async () => {},
      });
      res.json(jsonResponse);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })
);

/** Records the uploaded file's Blob URL once the browser's direct upload finishes. */
adminCatalogFileRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const url = clean(req.body?.url, 2000);
    const filename = clean(req.body?.filename, 255);
    const sizeBytes = Number(req.body?.sizeBytes);

    if (!url || !filename) {
      res.status(400).json({ error: "A file URL and filename are required." });
      return;
    }

    const previous = await prisma.catalogFile.findUnique({ where: { id: CATALOG_FILE_ID } });

    const file = await prisma.catalogFile.upsert({
      where: { id: CATALOG_FILE_ID },
      create: { id: CATALOG_FILE_ID, url, filename, sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : 0 },
      update: { url, filename, sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : 0, uploadedAt: new Date() },
    });

    // Best-effort: drop the file it replaced. Not fatal if this fails — an
    // orphaned Blob object is cheap; a broken catalogue page is not.
    if (previous && previous.url !== url) {
      await del(previous.url).catch(() => {});
    }

    res.status(201).json({ file });
  })
);

adminCatalogFileRouter.delete(
  "/",
  asyncRoute(async (req, res) => {
    const existing = await prisma.catalogFile.findUnique({ where: { id: CATALOG_FILE_ID } });
    if (!existing) {
      res.status(404).json({ error: "No custom catalogue is uploaded." });
      return;
    }

    await prisma.catalogFile.delete({ where: { id: CATALOG_FILE_ID } });
    await del(existing.url).catch(() => {});

    res.json({ ok: true });
  })
);
