import { Booking } from "@/lib/api";
import { useCallback, useState } from "react";

// In-memory store — replace with AsyncStorage/backend in production
const bookingsStore: Booking[] = [];

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([...bookingsStore]);

  const addBooking = useCallback((b: Booking) => {
    bookingsStore.unshift(b);
    setBookings([...bookingsStore]);
  }, []);

  const refresh = useCallback(() => {
    setBookings([...bookingsStore]);
  }, []);

  return { bookings, addBooking, refresh };
}
