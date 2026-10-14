import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncRoute } from "../../util.js";
import { requireOwner } from "../../auth.js";

/** The admin activity log — Owners only. Newest first, most recent 300 entries. */
export const adminActivityRouter = Router();

adminActivityRouter.use(requireOwner);

adminActivityRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    try {
      const entries = await prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
      res.json({ entries });
    } catch (err) {
      if (err?.code !== "P2021") throw err;
      res.json({ entries: [] });
    }
  })
);
