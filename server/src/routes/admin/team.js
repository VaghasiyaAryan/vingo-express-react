import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncRoute, clean } from "../../util.js";

export const adminTeamRouter = Router();

/** Normalises the admin team form's payload into a Prisma-shaped record. */
function teamDataFromBody(body = {}) {
  return {
    name: clean(body.name, 160),
    role: clean(body.role, 160),
    bio: clean(body.bio, 2000),
    photo: clean(body.photo, 2000) || null,
    featured: Boolean(body.featured),
    active: body.active !== false,
  };
}

function validate(data) {
  if (!data.name) return "A name is required.";
  if (!data.role) return "A role is required.";
  if (!data.bio) return "A bio is required.";
  return null;
}

adminTeamRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const team = await prisma.teamMember.findMany({ orderBy: [{ featured: "desc" }, { sortOrder: "asc" }] });
    res.json({ team });
  })
);

adminTeamRouter.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const member = await prisma.teamMember.findUnique({ where: { id: req.params.id } });
    if (!member) {
      res.status(404).json({ error: "Team member not found." });
      return;
    }
    res.json({ member });
  })
);

adminTeamRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const data = teamDataFromBody(req.body);
    const problem = validate(data);
    if (problem) {
      res.status(400).json({ error: problem });
      return;
    }

    // New members go to the end of the list; the admin can reorder later.
    const count = await prisma.teamMember.count();
    const member = await prisma.teamMember.create({ data: { ...data, sortOrder: count } });
    res.status(201).json({ member });
  })
);

adminTeamRouter.put(
  "/:id",
  asyncRoute(async (req, res) => {
    const data = teamDataFromBody(req.body);
    const problem = validate(data);
    if (problem) {
      res.status(400).json({ error: problem });
      return;
    }

    try {
      const member = await prisma.teamMember.update({ where: { id: req.params.id }, data });
      res.json({ member });
    } catch {
      res.status(404).json({ error: "Team member not found." });
    }
  })
);

adminTeamRouter.patch(
  "/:id/active",
  asyncRoute(async (req, res) => {
    const active = Boolean(req.body?.active);
    try {
      const member = await prisma.teamMember.update({ where: { id: req.params.id }, data: { active } });
      res.json({ member });
    } catch {
      res.status(404).json({ error: "Team member not found." });
    }
  })
);

adminTeamRouter.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    try {
      await prisma.teamMember.delete({ where: { id: req.params.id } });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Team member not found." });
    }
  })
);
