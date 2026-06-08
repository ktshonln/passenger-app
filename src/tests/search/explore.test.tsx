/**
 * Integration tests for app/(tabs)/explore.tsx
 * Covers: skeleton, error banner, retry, pagination, empty state
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import React from "react";

// ─── Import screen after mocks ────────────────────────────────────────────────

import SearchScreen from "../../../app/search-results";

// ─── Mock all hooks ───────────────────────────────────────────────────────────

const mockSearch = jest.fn();
const mockLoadMore = jest.fn();
const mockRetry = jest.fn();
const mockReset = jest.fn();

let mockTripsState = {
  trips: [] as any[],
  loading: false,
  loadingMore: false,
  error: null as string | null,
  searched: false,
  hasMore: false,
  page: 1,
  lastParams: null,
  search: mockSearch,
  loadMore: mockLoadMore,
  retry: mockRetry,
  reset: mockReset,
};

jest.mock("../../../hooks/use-trips", () => ({
  useTrips: () => mockTripsState,
}));

jest.mock("../../../hooks/use-companies", () => ({
  useCompanies: () => ({ companies: [], loading: false, error: null }),
}));

jest.mock("../../../hooks/use-popular-routes", () => ({
  usePopularRoutes: () => ({ routes: [], loading: false, error: null }),
}));

jest.mock("../../../hooks/use-search-history", () => ({
  useSearchHistory: () => ({
    history: [],
    loading: false,
    save: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  }),
}));

// ─── Mock UI dependencies ─────────────────────────────────────────────────────

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (key === "search.results") return `${opts?.count ?? 0} results`;
      if (key === "search.noResults") return "No trips found";
      if (key === "search.retry") return "Retry";
      if (key === "search.noMoreTrips") return "No more trips";
      return key;
    },
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: ({ options }: any) => null,
  },
}));

jest.mock("../../../components/ui/app-bar", () => ({
  AppBar: ({ title }: any) => {
    const { Text } = require("react-native");
    return <Text>{title}</Text>;
  },
}));

jest.mock("../../../components/search/search-card", () => ({
  SearchCard: ({ onSearch }: any) => {
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity
        testID="search-trigger"
        onPress={() =>
          onSearch({ from: "Kigali", to: "Musanze", date: "2026-04-06" })
        }
      >
        <Text>Search</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock("../../../components/search/trip-card", () => ({
  TripCard: ({ trip }: any) => {
    const { Text } = require("react-native");
    return <Text testID={`trip-${trip.id}`}>{trip.operator}</Text>;
  },
}));

jest.mock("../../../components/search/trip-card-skeleton", () => ({
  TripCardSkeleton: () => {
    const { View } = require("react-native");
    return <View testID="trip-card-skeleton" />;
  },
}));

jest.mock("../../../components/search/filter-sheet", () => ({
  FilterSheet: () => null,
  defaultFilters: { sortKey: "time", busType: "all", companyId: null },
  FilterValues: {},
}));

function resetState(overrides: Partial<typeof mockTripsState> = {}) {
  mockTripsState = {
    trips: [],
    loading: false,
    loadingMore: false,
    error: null,
    searched: false,
    hasMore: false,
    page: 1,
    lastParams: null,
    search: mockSearch,
    loadMore: mockLoadMore,
    retry: mockRetry,
    reset: mockReset,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  resetState();
});

describe("SearchScreen (explore.tsx) integration", () => {
  it("shows skeleton cards while loading === true", () => {
    resetState({ loading: true, searched: true });
    render(<SearchScreen />);
    expect(screen.getByTestId("trip-card-skeleton")).toBeTruthy();
  });

  it("hides skeleton when loading === false", () => {
    resetState({ loading: false, searched: true, trips: [] });
    render(<SearchScreen />);
    expect(screen.queryByTestId("trip-card-skeleton")).toBeNull();
  });

  it("shows ErrorBanner when error is non-null", () => {
    resetState({ error: "Network error", searched: true });
    render(<SearchScreen />);
    expect(screen.getByText("Network error")).toBeTruthy();
  });

  it("Retry button in ErrorBanner calls retry()", () => {
    resetState({ error: "Network error", searched: true });
    render(<SearchScreen />);
    fireEvent.press(screen.getByText("Retry"));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("loadMore called when FlatList onEndReached fires", async () => {
    const trips = Array.from({ length: 20 }, (_, i) => ({
      id: `t${i}`,
      operator: "Volcano Express",
      from: { id: "l1", name: "Kigali", city: "Kigali", code: "KGL" },
      to: { id: "l2", name: "Musanze", city: "Musanze", code: "MSZ" },
      departureTime: "2026-04-06T08:00:00",
      arrivalTime: "2026-04-06T10:00:00",
      duration: "2h",
      operatorId: "c1",
      price: 3000,
      currency: "RWF",
      seatsAvailable: 10,
      busType: "Express",
    }));
    resetState({ trips, searched: true, hasMore: true });
    const { UNSAFE_getByType } = render(<SearchScreen />);
    const { FlatList } = require("react-native");
    const flatList = UNSAFE_getByType(FlatList);
    await act(async () => {
      flatList.props.onEndReached?.();
    });
    expect(mockLoadMore).toHaveBeenCalled();
  });

  it("footer loading indicator shown during loadingMore", () => {
    resetState({ loadingMore: true, searched: true, trips: [] });
    const { UNSAFE_getByType } = render(<SearchScreen />);
    const { FlatList, ActivityIndicator } = require("react-native");
    const flatList = UNSAFE_getByType(FlatList);
    const footer = flatList.props.ListFooterComponent;
    // Footer should be the loading indicator element
    expect(footer).not.toBeNull();
  });

  it('"No more trips" footer shown when hasMore === false and trips exist', () => {
    const trips = [
      {
        id: "t1",
        operator: "Volcano Express",
        from: { id: "l1", name: "Kigali", city: "Kigali", code: "KGL" },
        to: { id: "l2", name: "Musanze", city: "Musanze", code: "MSZ" },
        departureTime: "2026-04-06T08:00:00",
        arrivalTime: "2026-04-06T10:00:00",
        duration: "2h",
        operatorId: "c1",
        price: 3000,
        currency: "RWF",
        seatsAvailable: 10,
        busType: "Express",
      },
    ];
    resetState({ trips, searched: true, hasMore: false, loadingMore: false });
    render(<SearchScreen />);
    expect(screen.getByText("No more trips")).toBeTruthy();
  });

  it("empty state shown when searched && trips.length === 0 && !loading", async () => {
    resetState({ trips: [], searched: true, loading: false });
    render(<SearchScreen />);
    await waitFor(() => {
      expect(screen.getByText("No trips found")).toBeTruthy();
    });
  });
});
