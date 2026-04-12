import { fetchTrips, Trip, TripSearchParams } from "@/lib/api";
import { MOCK_TRIPS, mockDelay } from "@/src/services/mock.data";
import { useCallback, useState } from "react";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (params: TripSearchParams) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      if (USE_MOCK) {
        await mockDelay(700);
        // Filter mock trips by operatorId if provided
        let results = [...MOCK_TRIPS];
        if (params.operatorId) {
          results = results.filter((t) => t.operatorId === params.operatorId);
        }
        setTrips(results);
      } else {
        setTrips(await fetchTrips(params));
      }
    } catch {
      setError("Failed to load trips. Please try again.");
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTrips([]);
    setError(null);
    setSearched(false);
  }, []);

  return { trips, loading, error, searched, search, reset };
}
