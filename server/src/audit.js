import { prisma } from "./prisma.js";
import { clean, clientIp } from "./util.js";

/**
 * Admin activity log. Records every change made through the admin API and
 * every sign-in attempt, so an Owner can see who did what and when.
 *
 * Only a short, safe description is stored — never passwords, never request
 * bodies. Writing the log never blocks or fails the action itself.
 */

const RETENTION_DAYS = 365;

export async function recordAudit({ req, admin, actor, action, detail, target, status }) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin && !admin.shared ? admin.id : null,
        actor: clean(actor ?? admin?.email ?? admin?.name ?? "unknown", 200) || "unknown",
        action,
        detail: detail ? clean(String(detail), 200) || null : null,
        target: target ? clean(String(target), 64) || null : null,
        status,
        ip: clientIp(req),
      },
    });
    // Housekeeping on roughly 1 in 50 writes: drop entries past retention.
    if (Math.random() < 0.02) {
      await prisma.adminAuditLog.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
      });
    }
  } catch (err) {
    // P2021: the table has not been created yet (npm run db:push).
    if (err?.code !== "P2021") console.error("Could not write admin audit log:", err);
  }
}

/**
 * [method, path pattern under /api/admin, label, detail-from-request]
 * The detail is read from the request body only for harmless fields
 * (a product name, a status, a role, an email being added).
 */
const ACTIONS = [
  ["POST", /^\/products$/, "Created product", (req) => req.body?.name],
  ["PUT", /^\/products\/([^/]+)$/, "Edited product", (req) => req.body?.name],
  ["PATCH", /^\/products\/([^/]+)\/active$/, "Changed product visibility", (req) => (req.body?.active ? "shown" : "hidden")],
  ["DELETE", /^\/products\/([^/]+)$/, "Deleted product"],
  ["POST", /^\/images$/, "Uploaded product photo"],
  ["PATCH", /^\/inquiries\/([^/]+)$/, "Changed enquiry status", (req) => req.body?.status],
  ["DELETE", /^\/inquiries\/([^/]+)$/, "Deleted enquiry"],
  ["POST", /^\/inquiries\/([^/]+)\/reply$/, "Replied to enquiry", (req) => req.body?.subject],
  ["PUT", /^\/settings\/hero-items$/, "Edited homepage buttons"],
  ["POST", /^\/password$/, "Changed own password"],
  ["POST", /^\/admins$/, "Added admin", (req) => [req.body?.email, req.body?.role].filter(Boolean).join(" · ")],
  ["PATCH", /^\/admins\/([^/]+)\/role$/, "Changed admin role", (req) => req.body?.role],
  ["POST", /^\/admins\/([^/]+)\/password$/, "Reset admin password"],
  ["DELETE", /^\/admins\/([^/]+)$/, "Removed admin"],
];

function describe(req) {
  // req.path inside the admin router is relative to /api/admin.
  for (const [method, pattern, label, detailOf] of ACTIONS) {
    if (method !== req.method) continue;
    const match = req.path.match(pattern);
    if (match) return { action: label, target: match[1], detail: detailOf?.(req) };
  }
  return { action: `${req.method} ${req.path}` };
}

/** Admin-router middleware: logs every non-GET request once its response is sent. */
export function auditAdminWrites(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return next();
  const described = describe(req);
  const admin = req.admin;
  res.on("finish", () => {
    recordAudit({ req, admin, ...described, status: res.statusCode });
  });
  next();
}
