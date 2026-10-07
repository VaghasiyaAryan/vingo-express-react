import { useEffect, useRef, useState } from "react";
import { onRequestCountChange } from "@/lib/api.js";

const CAP = 92;
const TICK_MS = 180;
const FADE_MS = 220;

/**
 * The thin loading bar across the top of the admin area.
 *
 * In the Next.js build this tracked route transitions, because every admin
 * navigation was a server round trip. Client-side routing made that
 * meaningless — the route itself resolves instantly and what a user actually
 * waits for is the API call the new page fires. So it tracks in-flight API
 * requests instead, which is both simpler and more honest. The System page's
 * once-a-second heartbeat opts out (`background: true` in lib/api.js), or the
 * bar would never turn off.
 */
export default function NavigationProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef(null);
  const timeoutsRef = useRef([]);
  const activeRef = useRef(false);

  useEffect(() => {
    const clearTimers = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      for (const id of timeoutsRef.current) clearTimeout(id);
      timeoutsRef.current = [];
    };

    const start = () => {
      if (activeRef.current) return;
      activeRef.current = true;
      clearTimers();
      setVisible(true);
      setProgress(14);
      // Ease towards the cap but never reach it — the bar only completes when
      // the request actually does.
      intervalRef.current = setInterval(() => {
        setProgress((p) => (p >= CAP ? p : p + Math.max(0.6, (CAP - p) * 0.14)));
      }, TICK_MS);
    };

    const finish = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      clearTimers();
      setProgress(100);
      timeoutsRef.current.push(
        setTimeout(() => {
          setVisible(false);
          timeoutsRef.current.push(setTimeout(() => setProgress(0), FADE_MS));
        }, FADE_MS)
      );
    };

    const unsubscribe = onRequestCountChange((count) => {
      if (count > 0) start();
      else finish();
    });

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity"
      style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
    >
      <div
        className="h-full bg-gradient-to-r from-navy-600 via-navy-500 to-orange-500 shadow-[0_0_8px_rgba(241,102,41,0.55)] transition-[width] ease-out"
        style={{ width: `${progress}%`, transitionDuration: `${TICK_MS}ms` }}
      />
    </div>
  );
}
