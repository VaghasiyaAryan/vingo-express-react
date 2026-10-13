import { Router } from "express";
import { requireAuth } from "../../auth.js";
import { adminAccountsRouter } from "./admins.js";
import { adminInquiriesRouter } from "./inquiries.js";
import { adminPasswordRouter } from "./password.js";
import { adminProductsRouter } from "./products.js";
import { adminSettingsRouter } from "./settings.js";
import { adminSystemRouter } from "./system.js";

export const adminRouter = Router();

// Everything below this line requires a valid admin session cookie.
adminRouter.use(requireAuth);

adminRouter.use("/inquiries", adminInquiriesRouter);
adminRouter.use("/products", adminProductsRouter);
adminRouter.use("/settings", adminSettingsRouter);
adminRouter.use("/password", adminPasswordRouter);
adminRouter.use("/admins", adminAccountsRouter); // Owner only
adminRouter.use("/", adminSystemRouter);
