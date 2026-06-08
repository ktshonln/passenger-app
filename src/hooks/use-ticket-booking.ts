/**
 * Hook for booking tickets
 */

import {
    bookTicket,
    type TicketRequest,
    type TicketResponse,
} from "@/src/services/trip.service";
import { useAuthStore } from "@/src/store/auth.store";
import { useState } from "react";

export function useTicketBooking() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function book(request: TicketRequest): Promise<TicketResponse | null> {
    setLoading(true);
    setError(null);

    try {
      const response = await bookTicket(request, token || undefined);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to book ticket";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { book, loading, error };
}
