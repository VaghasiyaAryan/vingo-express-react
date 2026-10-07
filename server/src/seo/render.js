import fs from "node:fs/promises";
import path from "node:path";
import { clientDist, isProduction } from "../config.js";
import { escapeHtml } from "../util.js";
import { resolveMeta } from "./meta.js";

/**
 * Serves the React app's index.html with per-route metadata stamped into
 * <head>.
 *
 * index.html carries an `<!--seo-head-->` marker and a `<title data-fallback>`.
 * This module replaces the marker with the resolved tags and drops the
 * fallback, so there is exactly one title element in the response.
 *
 * The fallback is matched by its attribute rather than by the tag name alone:
 * a bare `<title>` pattern would also match the one this module just injected
 * (and any that appears inside an HTML comment).
 */

const MARKER = "<!--seo-head-->";
const FALLBACK_TITLE = /[ \t]*<title data-fallback>[\s\S]*?<\/title>\n?/i;
const INDEX_HTML = path.join(clientDist, "index.html");

let cached = null;

async function readTemplate() {
  // Cached in production (the file never changes between deploys) and re-read
  // in development so an edit to index.html shows up without a restart.
  if (isProduction && cached) return cached;
  const html = await fs.readFile(INDEX_HTML, "utf8");
  cached = html;
  return html;
}

/** `<meta name="..." content="...">`, skipped entirely when the value is empty. */
function meta(attr, name, content) {
  if (!content) return "";
  return `<meta ${attr}="${escapeHtml(name)}" content="${escapeHtml(content)}">`;
}

/**
 * JSON-LD embedded in a <script> block. `<` is escaped so a stray "</script>"
 * inside a product description cannot close the tag early.
 */
function jsonLdScript(blocks) {
  if (!blocks || blocks.length === 0) return "";
  const payload = JSON.stringify(blocks.length === 1 ? blocks[0] : blocks).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${payload}</script>`;
}

export function renderHead(data) {
  const og = data.openGraph || {};
  const tw = data.twitter;

  const tags = [
    `<title>${escapeHtml(data.title)}</title>`,
    meta("name", "description", data.description),
    meta("name", "keywords", data.keywords?.join(", ")),
    meta("name", "robots", data.robots),
    meta("name", "theme-color", data.themeColor),
    data.canonical ? `<link rel="canonical" href="${escapeHtml(data.canonical)}">` : "",
    meta("property", "og:type", og.type),
    meta("property", "og:url", og.url),
    meta("property", "og:site_name", og.siteName),
    meta("property", "og:title", og.title),
    meta("property", "og:description", og.description),
    meta("property", "og:image", og.image),
    tw ? meta("name", "twitter:card", tw.card) : "",
    tw ? meta("name", "twitter:title", tw.title) : "",
    tw ? meta("name", "twitter:description", tw.description) : "",
    jsonLdScript(data.jsonLd),
  ];

  return tags.filter(Boolean).join("\n    ");
}

/**
 * Express handler for every non-API, non-asset GET. Resolves the route's
 * metadata, injects it, and returns the SPA shell — with a 404 status for
 * paths the app has no page for, so crawlers are told the truth.
 */
export async function serveApp(req, res, next) {
  let template;
  try {
    template = await readTemplate();
  } catch {
    res
      .status(503)
      .type("text/plain")
      .send(
        "The React app has not been built yet.\n\n" +
          "Run `npm run build` in client/, or start the Vite dev server with `npm run dev` " +
          "and open that instead — it proxies the API back to this server.\n"
      );
    return;
  }

  try {
    const data = await resolveMeta(req.path);
    const html = template.replace(FALLBACK_TITLE, "").replace(MARKER, renderHead(data));

    res.status(data.status).type("html").send(html);
  } catch (err) {
    next(err);
  }
}
