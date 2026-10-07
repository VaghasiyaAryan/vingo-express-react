import { useEffect } from "react";
import { company } from "@shared/content.js";

/**
 * Keeps the tab title right across client-side navigation.
 *
 * The tags a crawler reads are stamped into index.html by the Express server
 * before the page is sent (server/src/seo/) — this only covers what a human
 * sees after the app takes over routing, so it deliberately mirrors the same
 * "%s | VinGo International" template.
 */
export function useDocumentTitle(pageTitle) {
  useEffect(() => {
    if (!pageTitle) return undefined;

    const previous = document.title;
    document.title = pageTitle === "__default__" ? defaultTitle() : `${pageTitle} | ${company.shortName}`;

    return () => {
      document.title = previous;
    };
  }, [pageTitle]);
}

export function defaultTitle() {
  return `${company.name} — Dehydrated Fruits, Vegetables & Powders Exporter`;
}

/** For the homepage, which uses the untemplated site-wide title. */
export function useDefaultDocumentTitle() {
  useEffect(() => {
    document.title = defaultTitle();
  }, []);
}
