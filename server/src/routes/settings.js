import { Router } from "express";
import { asyncRoute } from "../util.js";
import { getPublicHeroItems } from "../settings.js";

export const settingsRouter = Router();

/** The buttons floating around the homepage logo: [{ label, slug }]. */
settingsRouter.get(
  "/hero-items",
  asyncRoute(async (req, res) => {
    res.json({ items: await getPublicHeroItems() });
  })
);
