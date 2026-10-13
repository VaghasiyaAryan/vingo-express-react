import { Router } from "express";
import { prisma } from "../../prisma.js";
import { asyncRoute, clean } from "../../util.js";
import { MIN_PASSWORD_LENGTH, hashPassword, normalizeEmail, requireOwner, setAccountPassword, setSessionCookie } from "../../auth.js";
import { newPasswordProblem } from "./password.js";

/**
 * Admin accounts — Owner only.
 *
 * Guard rails: nobody can remove or demote themselves (so there is always at
 * least the Owner doing the managing), and the last Owner can never be
 * removed or demoted by anyone.
 */
export const adminAccountsRouter = Router();

adminAccountsRouter.use(requireOwner);

const ROLES = ["OWNER", "EDITOR"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLIC_FIELDS = { id: true, name: true, email: true, role: true, createdAt: true, lastLoginAt: true };

async function ownerCount() {
  return prisma.adminUser.count({ where: { role: "OWNER" } });
}

adminAccountsRouter.get(
  "/",
  asyncRoute(async (req, res) => {
    const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: PUBLIC_FIELDS });
    res.json({ admins, minPasswordLength: MIN_PASSWORD_LENGTH });
  })
);

adminAccountsRouter.post(
  "/",
  asyncRoute(async (req, res) => {
    const name = clean(req.body?.name, 80);
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const isFirst = (await prisma.adminUser.count()) === 0;
    // The first account is always an Owner — someone has to be able to manage the rest.
    const role = isFirst ? "OWNER" : ROLES.includes(req.body?.role) ? req.body.role : "EDITOR";

    const errors = {};
    if (!name) errors.name = "Enter a name.";
    if (!EMAIL.test(email)) errors.email = "Enter a valid email address.";
    const problem = newPasswordProblem(password);
    if (problem) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (Object.keys(errors).length) {
      res.status(400).json({ error: problem || "Please check the highlighted fields.", errors });
      return;
    }

    const { hash, salt } = await hashPassword(password);
    let admin;
    try {
      admin = await prisma.adminUser.create({
        data: { name, email, role, passwordHash: hash, passwordSalt: salt },
        select: PUBLIC_FIELDS,
      });
    } catch (err) {
      if (err?.code === "P2002") {
        res.status(409).json({ error: "An admin with that email already exists.", errors: { email: "Already in use." } });
        return;
      }
      throw err;
    }

    // Creating the first account ends shared-password sessions — including
    // this one — so sign the creator in as that new account.
    if (req.admin.shared) await setSessionCookie(req, res, admin);

    res.status(201).json({ admin, signedInAs: req.admin.shared ? admin : undefined });
  })
);

adminAccountsRouter.patch(
  "/:id/role",
  asyncRoute(async (req, res) => {
    const role = req.body?.role;
    if (!ROLES.includes(role)) {
      res.status(400).json({ error: "Role must be Owner or Editor." });
      return;
    }
    if (req.params.id === req.admin.id) {
      res.status(400).json({ error: "You cannot change your own role." });
      return;
    }
    const target = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!target) {
      res.status(404).json({ error: "Admin not found." });
      return;
    }
    if (target.role === "OWNER" && role !== "OWNER" && (await ownerCount()) <= 1) {
      res.status(400).json({ error: "There must always be at least one Owner." });
      return;
    }
    const admin = await prisma.adminUser.update({ where: { id: target.id }, data: { role }, select: PUBLIC_FIELDS });
    res.json({ admin });
  })
);

/** Sets a new password for another admin (e.g. they forgot theirs). Signs them out everywhere. */
adminAccountsRouter.post(
  "/:id/password",
  asyncRoute(async (req, res) => {
    if (req.params.id === req.admin.id) {
      res.status(400).json({ error: "Change your own password on the Security page." });
      return;
    }
    const problem = newPasswordProblem(req.body?.password);
    if (problem) {
      res.status(400).json({ error: problem, errors: { password: `Use at least ${MIN_PASSWORD_LENGTH} characters.` } });
      return;
    }
    try {
      await setAccountPassword(req.params.id, req.body.password);
    } catch (err) {
      if (err?.code === "P2025") {
        res.status(404).json({ error: "Admin not found." });
        return;
      }
      throw err;
    }
    res.json({ ok: true });
  })
);

adminAccountsRouter.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    if (req.params.id === req.admin.id) {
      res.status(400).json({ error: "You cannot remove your own account." });
      return;
    }
    const target = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!target) {
      res.status(404).json({ error: "Admin not found." });
      return;
    }
    if (target.role === "OWNER" && (await ownerCount()) <= 1) {
      res.status(400).json({ error: "There must always be at least one Owner." });
      return;
    }
    await prisma.adminUser.delete({ where: { id: target.id } });
    res.json({ ok: true });
  })
);
