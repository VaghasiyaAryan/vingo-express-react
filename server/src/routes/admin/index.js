import { Router } from "express";
import { requireAuth } from "../../auth.js";
import { adminAccountRouter } from "./account.js";
import { adminCatalogFileRouter } from "./catalogFile.js";
import { adminInquiriesRouter } from "./inquiries.js";
import { adminProductsRouter } from "./products.js";
import { adminTeamRouter } from "./team.js";
import { adminSystemRouter } from "./system.js";

export const adminRouter = Router();

// Everything below this line requires a valid admin session cookie.
adminRouter.use(requireAuth);

adminRouter.use("/inquiries", adminInquiriesRouter);
adminRouter.use("/products", adminProductsRouter);
adminRouter.use("/team", adminTeamRouter);
adminRouter.use("/account", adminAccountRouter);
adminRouter.use("/catalog-file", adminCatalogFileRouter);
adminRouter.use("/", adminSystemRouter);
