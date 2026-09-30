import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncRoute } from "../util.js";

export const teamRouter = Router();

/**
 * The public team roster. Only active members, featured member first (for
 * the leader card) then the rest in the admin's chosen order.
 */
teamRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const team = await prisma.teamMember.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    });
    res.json({ team });
  })
);
