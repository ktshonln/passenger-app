import { Booking, fetchBookings } from "@/lib/api";
import { MOCK_PAST_BOOKINGS, mockDelay } from "@/src/services/mock.data";
import { useCallback, useState } from "react";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await mockDelay(500);
        setBookings(MOCK_PAST_BOOKINGS);
      } else {
        setBookings(await fetchBookings());
      }
    } catch {
      setError("Failed to load bookings.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimistic update after createBooking succeeds
  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => [b, ...prev]);
  }, []);

  return { bookings, loading, error, addBooking, refresh };
}
