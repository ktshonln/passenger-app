/**
 * Hook for fetching trip details
 */

import { getTripDetail, type TripDetail } from "@/src/services/trip.service";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function useTripDetail(tripId: string | null) {
  const { i18n } = useTranslation();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;

    let cancelled = false;

    async function fetchTrip() {
      setLoading(true);
      setError(null);

      try {
        const data = await getTripDetail(tripId, i18n.language);
        if (!cancelled) {
          setTrip(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load trip");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTrip();

    return () => {
      cancelled = true;
    };
  }, [tripId, i18n.language]);

  return { trip, loading, error };
}
