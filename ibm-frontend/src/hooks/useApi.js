import { useState, useEffect, useCallback } from "react";

/**
 * useApi(apiFn, deps)
 * Runs apiFn() on mount and whenever deps change.
 * Returns { data, loading, error, refetch }
 *
 * Usage:
 *   const { data: sales, loading, refetch } = useApi(() => api.rice.getSales(), []);
 */
export function useApi(apiFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, refetch: run };
}

/**
 * useMutation(apiFn)
 * Returns { mutate, loading, error }
 * Useful for POST/PUT/DELETE — does NOT auto-run.
 *
 * Usage:
 *   const { mutate, loading } = useMutation(body => api.rice.createSale(body));
 *   await mutate({ customer: "Jane", qty: 10, ppkg: 120, method: "Cash" });
 */
export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(payload);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { mutate, loading, error };
}
