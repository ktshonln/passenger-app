import { fetchPopularRoutes, PopularRoute } from "@/lib/api";
import { MOCK_POPULAR_ROUTES, mockDelay } from "@/src/services/mock.data";
import { useCallback, useEffect, useState } from "react";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export function usePopularRoutes() {
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await mockDelay(300);
        setRoutes(MOCK_POPULAR_ROUTES);
      } else {
        setRoutes(await fetchPopularRoutes());
      }
    } catch {
      setError("Failed to load popular routes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { routes, loading, error };
}
