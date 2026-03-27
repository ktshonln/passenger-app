import { Booking, getAuthToken } from "@/lib/api";
import { useCallback, useState } from "react";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.katisha.app";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/api/v1/bookings`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: Booking[] = await res.json();
      setBookings(data);
    } catch {
      setError("Failed to load bookings.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // addBooking kept for optimistic update after createBooking succeeds
  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => [b, ...prev]);
  }, []);

  return { bookings, loading, error, addBooking, refresh };
}
