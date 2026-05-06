import { fetchRecommendations, getAuthToken, Recommendation } from "@/lib/api";
import { useAuthStore } from "@/src/store/auth.store";
import { useCallback, useEffect, useState } from "react";

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const load = useCallback(async () => {
    if (!isAuthenticated || !getAuthToken()) return;
    setLoading(true);
    try {
      setRecommendations(await fetchRecommendations());
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  return { recommendations, loading };
}
