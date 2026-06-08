/**
 * Hook for fetching dynamic pricing based on stops
 */

import { getPrice, type PriceResponse } from "@/src/services/trip.service";
import { useEffect, useState } from "react";

export function usePricing(
  boardingStopId: string | null,
  alightingStopId: string | null,
  seatsCount: number = 1,
) {
  const [price, setPrice] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardingStopId || !alightingStopId) {
      setPrice(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchPrice() {
      setLoading(true);
      setError(null);

      try {
        const data = await getPrice(boardingStopId, alightingStopId);
        if (!cancelled) {
          setPrice(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to fetch price";
          // Check if it's a 404 PRICE_NOT_FOUND error
          if (
            errorMessage.includes("PRICE_NOT_FOUND") ||
            errorMessage.includes("404")
          ) {
            setError("PRICE_NOT_FOUND");
          } else {
            setError(errorMessage);
          }
          setPrice(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPrice();

    return () => {
      cancelled = true;
    };
  }, [boardingStopId, alightingStopId]);

  const totalPrice = price ? price.amount * seatsCount : null;

  return { price, totalPrice, loading, error };
}
