# VinGo International — Express + React

The VinGo International website as a **Node.js/Express API** (`server/`) and a **React
single-page app** (`client/`).

This is a self-contained rebuild of the Next.js version, which still lives in
`../Personal` and is unchanged. Both point at the same database and the same product
catalogue, so you can run either one and compare them before switching over.

---

## Layout

```
vingo-express-react/
├── shared/          Site copy and country data, imported by BOTH sides
├── server/          Express API + SEO-aware host for the built React app
│   └── prisma/      Database schema and the catalogue seed data
├── client/          React front end (Vite)
└── public/          Logo and product photos
```

The schema and the artwork started as copies of the Next.js project's. They are
independent now — a change in one will not reach the other, so if you edit the schema
here, apply it there too until you retire the Next.js build.

`shared/` holds the two files that are pure data with no framework in them —
`content.js` (every piece of editable website text) and `countries.js`. The Express
server imports them for the meta tags and the vCard; the React app imports them for the
page copy. **Editing `shared/content.js` is the single place to change website text**,
exactly as `lib/content.js` was in the Next.js build.

---

## Running it

Two terminals. First the API:

```bash
npm install --prefix server
```

```bash
npm run dev --prefix server
```

Then the front end:

```bash
npm install --prefix client
```

```bash
npm run dev --prefix client
```

Open <http://localhost:5173>. The Vite dev server proxies `/api`, `/sitemap.xml` and
`/robots.txt` to Express on port 4000, so the browser only ever sees one origin — which
is what keeps the admin session cookie working without any CORS configuration.

### Environment

The server reads, in order, whichever of these exist: `.env`, `.env.local`,
`server/.env`. Later files win — the same precedence Next.js uses.

`.env` and `.env.local` were copied across from the Next.js project, so the database,
admin password, Resend key and Blob token already work. `NEXT_PUBLIC_SITE_URL` is
accepted as an alias for `SITE_URL`, which is why the copied file needs no edits.

See `server/.env.example` for every variable and what happens without it.

---

## Deploying

The React app builds to static files that Express then serves — one process, one port,
no separate front-end host:

```bash
npm install --prefix client && npm run build --prefix client
```

```bash
NODE_ENV=production npm start --prefix server
```

Express serves the built app, the product photos, the API, `sitemap.xml` and
`robots.txt` from port 4000 (set `PORT` to change it). Put it behind Nginx, a load
balancer or a platform like Render/Railway/Fly and point your domain at it.

Set `SITE_URL` to your real domain in production — every canonical link, Open Graph tag,
JSON-LD URL and sitemap entry derives from it.

---

## How search engines still see this site

A React app hands crawlers an empty page. To avoid losing the search visibility the
Next.js build had, **Express fills in `<head>` before the HTML leaves the server**.

For every page request it works out the route, looks the product up in the database when
it needs to, and stamps the real `<title>`, description, canonical link, Open Graph tags
and JSON-LD into `index.html`. React then renders the page body in the browser.

```
GET /products/white-onion
  → <title>Dehydrated White Onion Supplier & Exporter from India | VinGo International</title>
    <meta name="description" content="Pungent white onion in kibbled, chopped…">
    <link rel="canonical" href="https://…/products/white-onion">
    <script type="application/ld+json">{Product}, {BreadcrumbList}</script>
  → React fills in the page
```

It also gets the status codes right: an unknown URL, or a product slug that is not in the
catalogue, returns a real **404** rather than a 200 with an error page.

`/sitemap.xml` and `/robots.txt` are generated live from the product table, so a product
you add in the admin panel is in the sitemap immediately.

All of this lives in `server/src/seo/`. `client/index.html` carries an `<!--seo-head-->`
marker where the tags go, plus a `<title data-fallback>` used when you open the Vite dev
server directly (the dev server does not run the injection step — build and run Express
if you want to check the tags).

**What this does not do:** the page body is still rendered by JavaScript. Google runs JS
and will index it, but if you later find you need the text in the initial HTML too, the
next step is server-rendering React in `server/src/seo/render.js`. The meta tags are the
part that matters most and they are handled.

---

## The API

Public:

| Method | Route | |
| --- | --- | --- |
| `GET` | `/api/products` | Active products, in catalogue order |
| `GET` | `/api/products/:slug` | One product + related items + its category |
| `POST` | `/api/inquiry` | Enquiry form submission (validated, honeypot-protected) |
| `GET` | `/api/catalog` | The catalogue PDF, generated fresh per request |
| `GET` | `/api/vcard` | The business card `.vcf` |

Session:

| Method | Route | |
| --- | --- | --- |
| `GET` | `/api/auth/session` | `{ authenticated: boolean }` |
| `POST` | `/api/auth/login` | Sets the session cookie |
| `POST` | `/api/auth/logout` | Clears it |

Admin — every route below requires the session cookie and returns `401` without it:

| Method | Route | |
| --- | --- | --- |
| `GET` | `/api/admin/stats` | Dashboard totals, status breakdown, 30-day trend |
| `GET` | `/api/admin/health` | Database reachability + latency |
| `GET` | `/api/admin/config` | Which optional integrations are configured |
| `GET` | `/api/admin/catalog-summary` | Active product counts per category |
| `GET` | `/api/admin/inquiries` | All enquiries, newest first |
| `PATCH` | `/api/admin/inquiries/:id` | Change status |
| `DELETE` | `/api/admin/inquiries/:id` | Delete |
| `POST` | `/api/admin/inquiries/:id/reply` | Send a reply via Resend |
| `GET` `POST` | `/api/admin/products` | List all / create |
| `GET` `PUT` `DELETE` | `/api/admin/products/:id` | Read / update / delete |
| `PATCH` | `/api/admin/products/:id/active` | Show or hide on the public site |
| `POST` | `/api/admin/upload-token` | Short-lived token for direct photo upload |

### Admin sign-in

Unchanged in substance: one password (`ADMIN_PASSWORD`), which also signs the session
cookie, so changing the password signs every session out. Repeated failures from one IP
are rate-limited to 5 per 15 minutes, recorded in the database so the limit survives a
restart.

The cookie is `httpOnly` and `SameSite=Lax`, and `Secure` in production. The React
`RequireAuth` guard is a convenience for the user — the real check is the
`requireAuth` middleware every `/api/admin` request passes through.

---

## What changed, and why

Most of the site is a direct port. These are the places where the two stacks genuinely
differ and a decision had to be made.

| | Next.js build | This build |
| --- | --- | --- |
| **Data fetching** | Server Components read the database directly during render | Pages fetch from the API and show a loading state |
| **Mutations** | Server Actions | REST endpoints under `/api/admin` |
| **Cache busting** | `revalidatePath` after every write | Not needed — nothing is cached; the page updates its own state after a write |
| **Metadata** | `export const metadata` per page | Resolved in `server/src/seo/meta.js` and injected |
| **Images** | `next/image` resized and re-encoded uploads | Plain `<img>`, served as uploaded |
| **Fonts** | `next/font/google` | Linked from `client/index.html` |
| **Analytics** | `@vercel/analytics`, only works on Vercel | A shim that dispatches to whatever the page has (Vercel, GA4, Plausible, Umami) — no-ops when there is none |
| **Catalogue PDF** | JSX | `React.createElement`, so the server needs no build step |
| **Admin progress bar** | Tracked route transitions | Tracks in-flight API requests, which is what you actually wait for now |

Three things worth knowing:

**Product photos are no longer optimised.** `next/image` used to resize and re-encode
uploads. Nothing does that now, so upload photos already sized for the web — around
1200px wide is plenty. An oversized photo will still display, just slowly.

**Navigation links became absolute.** The navbar and footer used bare `#about` fragments,
which only worked on the homepage. They are now `/#about`, so they work from a product or
legal page too.

**Analytics needs re-wiring if you move off Vercel.** The event calls are all still
there and named the same. Add a GA4 (or Plausible, or Umami) snippet to
`client/index.html` and they start reporting — no code changes.

---

## Where things are

| What you want to change | Where |
| --- | --- |
| **The product catalogue** — products, specs, photos, visibility | `/admin/products`, no code changes needed |
| **All other website text** — stats, countries, FAQs, contact details | `shared/content.js` |
| Brand colours, fonts, animations | `client/tailwind.config.js` |
| Page section order | `client/src/pages/Home.jsx` |
| Individual sections | `client/src/components/sections/` |
| Logo | `client/src/components/Logo.jsx`, `public/logo.svg` |
| Page titles, descriptions, JSON-LD | `server/src/seo/meta.js` |
| Catalogue PDF layout | `server/src/pdf/CatalogDocument.js` |
| Database schema | `server/prisma/schema.prisma` |
| Admin dashboard | `client/src/admin/` |

Everything the Next.js project's `README.md` says about brand colours, the logo files
and the product catalogue still applies here — only the paths moved.
