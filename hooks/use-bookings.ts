import { Booking, fetchBookings } from "@/lib/api";
import { useCallback, useState } from "react";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await fetchBookings());
    } catch {
      setError("Failed to load bookings.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => [b, ...prev]);
  }, []);

  return { bookings, loading, error, addBooking, refresh };
}
