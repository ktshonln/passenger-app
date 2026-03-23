import { fetchTrips, Trip, TripSearchParams } from "@/lib/api";
import { useCallback, useState } from "react";

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
      const data = await fetchTrips(params);
      setTrips(data);
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
