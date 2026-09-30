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

/** First entry of X-Forwarded-For, or the socket address. */
export function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return req.ip || "unknown";
}
