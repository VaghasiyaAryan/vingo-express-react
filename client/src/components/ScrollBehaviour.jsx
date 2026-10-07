import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Restores the two scroll behaviours a full page load gives you for free and
 * a client-side router does not:
 *
 *   - a new route starts at the top of the page
 *   - a URL with a #fragment scrolls to that element
 *
 * The fragment case has to wait a frame: React commits the new route's DOM
 * after this effect's first pass, so the target element does not exist yet on
 * the navigation that introduced it.
 */
export default function ScrollBehaviour() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" in window ? "instant" : "auto" });
      return undefined;
    }

    const id = decodeURIComponent(hash.slice(1));
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname, hash]);

  return null;
}
