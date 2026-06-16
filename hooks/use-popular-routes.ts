import { fetchPopularRoutes, PopularRoute } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export function usePopularRoutes() {
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRoutes(await fetchPopularRoutes());
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { routes, loading };
}
