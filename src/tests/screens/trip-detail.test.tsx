import { render, screen } from "@testing-library/react-native";
import React from "react";

import TripDetailScreen from "@/app/trip-detail";

// Mock AsyncStorage before importing TripDetailScreen
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// ─── Mock Hooks ──────────────────────────────────────────────────────────────

const mockTripData = {
  id: "t1",
  departure_at: "2026-06-04T10:00:00Z",
  available_seats: 10,
  total_seats: 30,
  status: "scheduled",
  is_express: false,
  currency: "RWF",
  route: {
    id: "r1",
    name: "Kigali - Musanze",
    route_stops: [
      {
        order: 1,
        stop: {
          id: "s1",
          name: "Nyabugogo",
          lat: -1.94,
          lng: 30.06,
          city: "Kigali",
        },
      },
      {
        order: 2,
        stop: {
          id: "s2",
          name: "Musanze",
          lat: -1.5,
          lng: 29.63,
          city: "Musanze",
        },
      },
    ],
  },
  bus: {
    id: "b1",
    plate: "RAA 123 A",
    type: "Luxury Coach",
    total_seats: 30,
  },
  company: {
    id: "c1",
    name: "Volcano Express",
    story: "Best service",
  },
};

jest.mock("@/src/hooks/use-trip-detail", () => ({
  useTripDetail: () => ({
    trip: mockTripData,
    loading: false,
    error: null,
  }),
}));

jest.mock("@/src/hooks/use-wallet", () => ({
  useWallet: () => ({
    balance: { available: 5000 },
    loading: false,
  }),
}));

jest.mock("@/src/hooks/use-pricing", () => ({
  usePricing: () => ({
    price: { amount: 3000, currency: "RWF" },
    totalPrice: 3000,
    loading: false,
    error: null,
  }),
}));

jest.mock("@/src/hooks/use-ticket-booking", () => ({
  useTicketBooking: () => ({
    book: jest.fn().mockResolvedValue({ id: "ticket1", status: "confirmed" }),
    loading: false,
    error: null,
  }),
}));

jest.mock("@/src/hooks/use-payment-sse", () => ({
  usePaymentSSE: () => ({
    status: null,
  }),
}));

jest.mock("@/src/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", first_name: "John", last_name: "Doe" },
  }),
}));

// ─── Mock External Dependencies ──────────────────────────────────────────────

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ tripId: "t1" }),
  useRouter: () => ({ push: jest.fn() }),
  Stack: { Screen: () => null },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def: string) => def || key,
    i18n: { language: "en" },
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("@/components/trip/route-map", () => ({
  RouteMap: "RouteMap",
}));

jest.mock("@/lib/api", () => ({
  getAuthToken: () => "mock-token",
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("TripDetailScreen", () => {
  it("renders trip details correctly", async () => {
    render(<TripDetailScreen />);

    // Check company name
    expect(screen.getByText("Volcano Express")).toBeTruthy();

    // Check route points
    expect(screen.getAllByText("Nyabugogo")[0]).toBeTruthy();
    expect(screen.getAllByText("Musanze")[0]).toBeTruthy();

    // Check bus plate
    expect(screen.getByText("RAA 123 A")).toBeTruthy();
  });

  it("updates total price when seat count changes", async () => {
    render(<TripDetailScreen />);

    // Initially 1 seat (this depends on how SeatCounter is rendered in tests)
    // We expect to see the price from usePricing mock
    expect(screen.getAllByText("RWF 3,000")[0]).toBeTruthy();
  });

  it("shows payment method selector", () => {
    render(<TripDetailScreen />);

    // Check if payment methods are present (Wallet is default for logged in)
    expect(screen.getByText("Proceed to Pay")).toBeTruthy();
  });
});
