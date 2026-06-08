import { fetchPopularRoutes, getAuthToken, PopularRoute } from "@/lib/api";
import { useAuthStore } from "@/src/store/auth.store";
import { useCallback, useEffect, useState } from "react";

export function usePopularRoutes() {
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const load = useCallback(async () => {
    // In mock mode, load without auth check
    const isMock = process.env.EXPO_PUBLIC_USE_MOCK === "true";
    if (!isMock && (!isAuthenticated || !getAuthToken())) return;
    setLoading(true);
    try {
      setRoutes(await fetchPopularRoutes());
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  return { routes, loading };
}
