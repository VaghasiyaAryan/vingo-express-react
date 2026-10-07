import { Router } from "express";
import { requireAuth } from "../../auth.js";
import { adminInquiriesRouter } from "./inquiries.js";
import { adminProductsRouter } from "./products.js";
import { adminSystemRouter } from "./system.js";

export const adminRouter = Router();

// Everything below this line requires a valid admin session cookie.
adminRouter.use(requireAuth);

adminRouter.use("/inquiries", adminInquiriesRouter);
adminRouter.use("/products", adminProductsRouter);
adminRouter.use("/", adminSystemRouter);
