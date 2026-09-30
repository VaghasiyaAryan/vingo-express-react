import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fetch-on-mount with the three states every page here needs: loading, error,
 * data — plus a `reload` for after a mutation.
 *
 * `fetcher` is called with an AbortSignal and must be stable (wrap it in
 * useCallback, or pass a module-level function) — it is the effect's only
 * dependency besides `deps`.
 */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcher(controller.signal)
      .then((data) => {
        if (cancelled) return;
        setState({ data, error: null, loading: false });
      })
      .catch((err) => {
        if (cancelled || err?.name === "AbortError") return;
        setState({ data: null, error: err, loading: false });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  /** Patch the cached data in place — avoids a round trip after a local edit. */
  const mutate = useCallback((updater) => {
    setState((prev) => ({ ...prev, data: typeof updater === "function" ? updater(prev.data) : updater }));
  }, []);

  return { ...state, reload, mutate };
}
