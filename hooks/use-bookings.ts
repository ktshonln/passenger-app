import { Booking, fetchBookings } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/src/store/auth.store";

const BOOKINGS_KEY = "katisha_bookings";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Helper to enrich booking with user's name
  const enrichBookingWithUser = useCallback((booking: Booking): Booking => {
    const userFullName = user?.first_name 
      ? `${user.first_name} ${user.last_name || ""}`.trim() 
      : "Passenger";
    return {
      ...booking,
      passenger: {
        ...booking.passenger,
        fullName: userFullName,
      },
    };
  }, [user]);

  // Load bookings from AsyncStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Re-enrich when user changes
  useEffect(() => {
    if (bookings.length > 0) {
      setBookings(prev => prev.map(enrichBookingWithUser));
    }
  }, [user, enrichBookingWithUser]);

  const loadFromStorage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBookings(parsed.map(enrichBookingWithUser));
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  }, [enrichBookingWithUser]);

  const saveToStorage = useCallback(async (newBookings: Booking[]) => {
    try {
      await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(newBookings));
    } catch {
      // Ignore errors
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await fetchBookings();
      const enriched = fetched.map(enrichBookingWithUser);
      setBookings(enriched);
      saveToStorage(enriched);
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [saveToStorage, enrichBookingWithUser]);

  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => {
      const enriched = enrichBookingWithUser(b);
      const newBookings = [enriched, ...prev];
      saveToStorage(newBookings);
      return newBookings;
    });
  }, [saveToStorage, enrichBookingWithUser]);

  return { bookings, loading, error, addBooking, refresh };
}
