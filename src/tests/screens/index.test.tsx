import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import HomeScreen from "@/app/(tabs)/index";

// Mock AsyncStorage before importing HomeScreen
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// ─── Mock Hooks ──────────────────────────────────────────────────────────────

jest.mock("@/hooks/use-companies", () => ({
  useCompanies: () => ({
    companies: [
      {
        id: "c1",
        name: "Volcano Express",
        shortName: "Volcano",
        logoUrl: "🌋",
        rating: 4.8,
        totalTripsPerDay: 50,
        color: "#E53E3E",
      },
    ],
    loading: false,
  }),
}));

jest.mock("@/hooks/use-locations", () => ({
  useLocations: () => ({
    results: [],
    loading: false,
  }),
}));

jest.mock("@/hooks/use-popular-routes", () => ({
  usePopularRoutes: () => ({
    routes: [
      {
        from: { city: "Kigali", code: "KGL" },
        to: { city: "Musanze", code: "MSZ" },
        duration: "2h",
        tripsPerDay: 20,
        minPrice: 3000,
        currency: "RWF",
      },
    ],
    loading: false,
  }),
}));

jest.mock("@/hooks/use-recommendations", () => ({
  useRecommendations: () => ({
    recommendations: [],
    loading: false,
  }),
}));

jest.mock("@/hooks/use-trips", () => ({
  useTrips: () => ({
    trips: [],
    search: jest.fn(),
    loading: false,
  }),
}));

jest.mock("@/src/store/auth.store", () => ({
  useAuthStore: (selector: any) => {
    const state = { user: { first_name: "John" } };
    return selector ? selector(state) : state;
  },
}));

// ─── Mock External Dependencies ──────────────────────────────────────────────

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def: string) => {
      if (key === "home.goodMorning") return "Good Morning";
      return def || key;
    },
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-blur", () => ({
  BlurView: "BlurView",
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("HomeScreen", () => {
  it("renders correctly with greeting", () => {
    render(<HomeScreen />);

    // Check for greeting
    expect(screen.getByText(/John/)).toBeTruthy();
  });

  it("shows popular routes", () => {
    render(<HomeScreen />);

    expect(screen.getByText("Kigali → Musanze")).toBeTruthy();
    expect(screen.getByText("KGL")).toBeTruthy();
    expect(screen.getByText("MSZ")).toBeTruthy();
  });

  it("shows bus companies", () => {
    render(<HomeScreen />);

    expect(screen.getByText("Volcano")).toBeTruthy();
    expect(screen.getByText("4.8")).toBeTruthy();
  });

  it("opens search modal when input is focused", async () => {
    render(<HomeScreen />);

    const searchInput = screen.getByPlaceholderText(
      "Search destinations, routes, companies...",
    );
    fireEvent(searchInput, "focus");
  });
});
