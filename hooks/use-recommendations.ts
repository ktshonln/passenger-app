import { fetchRecommendations, Recommendation } from "@/lib/api";
import { getMockRecommendations, mockDelay } from "@/src/services/mock.data";
import { useCallback, useEffect, useState } from "react";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await mockDelay(500);
        setRecommendations(getMockRecommendations());
      } else {
        setRecommendations(await fetchRecommendations());
      }
    } catch {
      setError("Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { recommendations, loading, error };
}
