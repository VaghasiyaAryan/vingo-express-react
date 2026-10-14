const HTML_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes a value for interpolation into an HTML attribute or text node. */
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);
}

/** Trims and hard-caps a submitted string; non-strings become "". */
export function clean(value, limit) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, limit);
}

/** "White Onion Flakes" -> "white-onion-flakes" */
export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "Kibbled, Chopped, Powder" -> ["Kibbled", "Chopped", "Powder"] */
export function parseListField(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "Moisture: Max 5%\nPacking: 20 kg" -> { Moisture: "Max 5%", Packing: "20 kg" } */
export function parseSpecsField(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;

  const specs = {};
  for (const line of String(value ?? "").split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key && val) specs[key] = val;
  }
  return specs;
}

/** Wraps an async route handler so a rejected promise reaches the error middleware. */
export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

/**
 * The visitor's real IP, for rate limits and logs.
 *
 * Never the first X-Forwarded-For entry: the visitor's own browser can set
 * that header to anything, which would let an attacker pick a fresh "IP" for
 * every login guess. Every request to this site arrives through Cloudflare,
 * which sets CF-Connecting-IP itself (overwriting any value the visitor sent);
 * otherwise Express's req.ip, which only trusts the configured proxy hop.
 */
export function clientIp(req) {
  const cf = req.headers["cf-connecting-ip"];
  if (typeof cf === "string" && cf.trim()) return cf.trim();
  return req.ip || "unknown";
}
