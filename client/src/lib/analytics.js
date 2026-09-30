/**
 * Custom event tracking.
 *
 * The Next.js build sent these to Vercel Analytics via `@vercel/analytics`,
 * which only works when the app is deployed on Vercel — this build is a plain
 * Express server that can run anywhere, so the dependency is gone and this
 * dispatches to whatever analytics the page actually has:
 *
 *   window.va       Vercel Analytics, if the site is still hosted there
 *   window.gtag     Google Analytics 4
 *   window.plausible / window.umami
 *
 * With none of them present every call is a no-op, which is the correct
 * behaviour for a site with no analytics configured. To wire up GA4, add its
 * gtag snippet to client/index.html — nothing here needs to change.
 */

function dispatch(event, props) {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.va === "function") {
      window.va("event", { name: event, ...props });
      return;
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", event, props || {});
      return;
    }
    if (typeof window.plausible === "function") {
      window.plausible(event, props ? { props } : undefined);
      return;
    }
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(event, props);
    }
  } catch {
    // Analytics must never break the UI it is instrumenting.
  }
}

export const analytics = {
  whatsappClick: (context) => dispatch("whatsapp_click", { context }),
  emailClick: (context) => dispatch("email_click", { context }),
  phoneClick: (context) => dispatch("phone_click", { context }),
  enquirySubmit: (props) => dispatch("enquiry_submit", props),
  productView: (slug) => dispatch("product_view", { slug }),
  quoteRequest: (context) => dispatch("quote_request", { context }),
  coaDownload: (slug) => dispatch("coa_download", { slug }),
  catalogDownload: (context) => dispatch("catalog_download", { context }),
};
