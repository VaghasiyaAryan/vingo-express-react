import { Router } from "express";
import { asyncRoute } from "../../util.js";
import { updateAdminAccount } from "../../auth.js";

export const adminAccountRouter = Router();

/** The signed-in admin's own profile — never the password hash. */
adminAccountRouter.get("/", (req, res) => {
  res.json({ username: req.admin.username, email: req.admin.email });
});

/**
 * Updates username/email and, optionally, the password. Always requires
 * currentPassword — see updateAdminAccount for why.
 */
adminAccountRouter.put(
  "/",
  asyncRoute(async (req, res) => {
    const { currentPassword, username, email, newPassword } = req.body || {};
    const result = await updateAdminAccount({ currentPassword, username, email, newPassword });

    if (result.error) {
      res.status(result.status || 400).json({ error: result.error });
      return;
    }

    res.json({
      username: result.admin.username,
      email: result.admin.email,
      passwordChanged: result.passwordChanged,
    });
  })
);
