import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncRoute } from "../util.js";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const imagesRouter = Router();

/**
 * Serves an uploaded product photo. An id is never reused for different
 * bytes — replacing a photo uploads a new one — so it can be cached forever.
 */
imagesRouter.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const image = await prisma.image.findUnique({ where: { id: req.params.id } });
    if (!image) {
      res.status(404).json({ error: "Image not found." });
      return;
    }
    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(Buffer.from(image.data));
  })
);
