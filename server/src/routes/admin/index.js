import { Router } from "express";
import { requireAuth } from "../../auth.js";
import { auditAdminWrites } from "../../audit.js";
import { adminAccountsRouter } from "./admins.js";
import { adminActivityRouter } from "./activity.js";
import { adminInquiriesRouter } from "./inquiries.js";
import { adminPasswordRouter } from "./password.js";
import { adminProductsRouter } from "./products.js";
import { adminSettingsRouter } from "./settings.js";
import { adminSystemRouter } from "./system.js";

export const adminRouter = Router();

// Everything below this line requires a valid admin session cookie.
adminRouter.use(requireAuth);
// …and every change made through it is written to the activity log.
adminRouter.use(auditAdminWrites);

adminRouter.use("/inquiries", adminInquiriesRouter);
adminRouter.use("/products", adminProductsRouter);
adminRouter.use("/settings", adminSettingsRouter);
adminRouter.use("/password", adminPasswordRouter);
adminRouter.use("/admins", adminAccountsRouter); // Owner only
adminRouter.use("/activity", adminActivityRouter); // Owner only
adminRouter.use("/", adminSystemRouter);
