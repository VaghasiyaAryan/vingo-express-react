import { useEffect, useRef, useState } from "react";

/**
 * For sections with endless CSS animations (spinning rings, floating buttons,
 * the country ticker): returns a ref for the section and a class that pauses
 * every animation inside it while it is off-screen, so the phone is not
 * redrawing things nobody can see while the visitor scrolls the rest of the page.
 *
 *   const [ref, pausedClass] = usePauseOffscreen();
 *   <div ref={ref} className={`... ${pausedClass}`}>
 */
export function usePauseOffscreen(rootMargin = "100px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, visible ? "" : "anim-paused"];
}
