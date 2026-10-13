import { Router } from "express";
import { asyncRoute } from "../../util.js";
import { HERO_ITEM_COUNT, HERO_LABEL_MAX_LENGTH, getHeroItems, parseHeroItems, saveHeroItems } from "../../settings.js";

export const adminSettingsRouter = Router();

adminSettingsRouter.get(
  "/hero-items",
  asyncRoute(async (req, res) => {
    res.json({ items: await getHeroItems(), maxLength: HERO_LABEL_MAX_LENGTH });
  })
);

adminSettingsRouter.put(
  "/hero-items",
  asyncRoute(async (req, res) => {
    const items = parseHeroItems(req.body?.items);
    if (!items) {
      res.status(400).json({ error: `Please give all ${HERO_ITEM_COUNT} buttons some text and pick a product from the list.` });
      return;
    }

    try {
      res.json({ items: await saveHeroItems(items) });
    } catch (err) {
      if (err?.code !== "P2021") throw err;
      res.status(503).json({
        error: "The settings table has not been created yet. Run `npm run db:push --prefix server`, then try again.",
      });
    }
  })
);
