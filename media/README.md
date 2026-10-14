# Media sources (not published)

Nothing in this folder is served by the website.

`product-photos-original/` holds the full-size JPG product photos. The site
serves web-optimised copies from `public/products/`:

- `<slug>.webp` — up to 1200px wide, for the product page
- `<slug>-600.webp` — 600px wide, for product cards

A product shows its photo when its **image** field (Admin → Products) is set to
`/products/<slug>.webp`. To add or replace a photo, either upload it in
Admin → Products, or export a WebP at those two widths into `public/products/`
and set the image field.
