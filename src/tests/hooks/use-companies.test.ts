/**
 * Tests for hooks/use-companies, use-recommendations,
 * use-popular-routes, use-search-history, use-trips, use-bookings
 */

import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useBookings } from "../../../hooks/use-bookings";
import { useCompanies } from "../../../hooks/use-companies";
import { usePopularRoutes } from "../../../hooks/use-popular-routes";
import { useRecommendations } from "../../../hooks/use-recommendations";
import { useSearchHistory } from "../../../hooks/use-search-history";
import { useTrips } from "../../../hooks/use-trips";
import {
    MOCK_PAST_BOOKINGS,
    MOCK_SEARCH_HISTORY,
} from "../../services/mock.data";

// Force mock mode for all hook tests
jest.mock("../../../src/services/mock.data", () => ({
  ...jest.requireActual("../../../src/services/mock.data"),
  mockDelay: () => Promise.resolve(), // skip delays in tests
}));

// ─── useCompanies ─────────────────────────────────────────────────────────────

describe("useCompanies", () => {
  it("loads companies on mount", async () => {
    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.companies.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it("returns companies matching PublicOrganization mapped shape", async () => {
    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const first = result.current.companies[0];
    expect(first.id).toBeTruthy();
    expect(first.name).toBeTruthy();
    expect(first.shortName).toBe(first.name);
    expect(first.color).toBe("#0A4370");
    expect(first.rating).toBe(0);
    expect(first.totalTripsPerDay).toBe(0);
    expect(first.popular).toBe(false);
  });
});

// ─── useRecommendations ───────────────────────────────────────────────────────

describe("useRecommendations", () => {
  it("loads recommendations on mount", async () => {
    const { result } = renderHook(() => useRecommendations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.recommendations.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it("each recommendation has trip, reason, reasonLabel", async () => {
    const { result } = renderHook(() => useRecommendations());
    await waitFor(() => expect(result.current.loading).toBe(false));
    for (const r of result.current.recommendations) {
      expect(r.trip).toBeDefined();
      expect(["past_route", "popular", "nearby"]).toContain(r.reason);
      expect(r.reasonLabel).toBeTruthy();
    }
  });
});

// ─── usePopularRoutes ─────────────────────────────────────────────────────────

describe("usePopularRoutes", () => {
  it("loads popular routes on mount", async () => {
    const { result } = renderHook(() => usePopularRoutes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.routes.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it("routes have from, to, minPrice, tripsPerDay", async () => {
    const { result } = renderHook(() => usePopularRoutes());
    await waitFor(() => expect(result.current.loading).toBe(false));
    for (const r of result.current.routes) {
      expect(r.from).toBeDefined();
      expect(r.to).toBeDefined();
      expect(r.minPrice).toBeGreaterThan(0);
      expect(r.tripsPerDay).toBeGreaterThan(0);
    }
  });
});

// ─── useSearchHistory ─────────────────────────────────────────────────────────

describe("useSearchHistory", () => {
  it("loads history on mount", async () => {
    const { result } = renderHook(() => useSearchHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.history.length).toBeGreaterThan(0);
  });

  it("remove() deletes an item by id", async () => {
    const { result } = renderHook(() => useSearchHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstId = result.current.history[0].id;
    await act(async () => {
      await result.current.remove(firstId);
    });
    expect(
      result.current.history.find((h) => h.id === firstId),
    ).toBeUndefined();
  });

  it("clear() empties the history", async () => {
    const { result } = renderHook(() => useSearchHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.clear();
    });
    expect(result.current.history).toHaveLength(0);
  });

  it("save() prepends a new item", async () => {
    const { result } = renderHook(() => useSearchHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const before = result.current.history.length;
    await act(async () => {
      await result.current.save({
        from: MOCK_SEARCH_HISTORY[0].from,
        to: MOCK_SEARCH_HISTORY[0].to,
        date: "2026-05-01",
      });
    });
    expect(result.current.history.length).toBe(before + 1);
    expect(result.current.history[0].date).toBe("2026-05-01");
  });
});

// ─── useTrips ─────────────────────────────────────────────────────────────────

describe("useTrips", () => {
  it("starts with empty state", () => {
    const { result } = renderHook(() => useTrips());
    expect(result.current.trips).toHaveLength(0);
    expect(result.current.searched).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("search() populates trips", async () => {
    const { result } = renderHook(() => useTrips());
    await act(async () => {
      await result.current.search({
        from: "KGL",
        to: "MSZ",
        date: "2026-04-06",
      });
    });
    expect(result.current.searched).toBe(true);
    expect(result.current.trips.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it("filters by operatorId when provided", async () => {
    const { result } = renderHook(() => useTrips());
    await act(async () => {
      await result.current.search({
        from: "KGL",
        to: "MSZ",
        date: "2026-04-06",
        operatorId: "c1",
      });
    });
    for (const t of result.current.trips) {
      expect(t.operatorId).toBe("c1");
    }
  });

  it("reset() clears trips and searched flag", async () => {
    const { result } = renderHook(() => useTrips());
    await act(async () => {
      await result.current.search({
        from: "KGL",
        to: "MSZ",
        date: "2026-04-06",
      });
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.trips).toHaveLength(0);
    expect(result.current.searched).toBe(false);
  });
});

// ─── useBookings ──────────────────────────────────────────────────────────────

describe("useBookings", () => {
  it("starts with empty bookings", () => {
    const { result } = renderHook(() => useBookings());
    expect(result.current.bookings).toHaveLength(0);
  });

  it("refresh() loads mock bookings", async () => {
    const { result } = renderHook(() => useBookings());
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.bookings.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it("addBooking() prepends a booking optimistically", async () => {
    const { result } = renderHook(() => useBookings());
    const newBooking = MOCK_PAST_BOOKINGS[0];
    act(() => {
      result.current.addBooking(newBooking);
    });
    expect(result.current.bookings[0].id).toBe(newBooking.id);
  });
});

// ─── useCompanies — public API tests ─────────────────────────────────────────

describe("useCompanies — public API (no auth)", () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockClear();
    global.fetch = mockFetch;
    // Default: audit log / other calls return 204
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
  });

  afterAll(() => {
    // Restore fetch so other tests are unaffected
    (global as any).fetch = undefined;
  });

  it("calls /api/v1/organizations/public without Authorization header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: "c1",
          name: "Volcano Express",
          slug: "volcano",
          org_type: "bus_company",
          logo_path: "/logos/volcano.png",
          story: null,
        },
      ],
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const calls = mockFetch.mock.calls.filter(([url]: [string]) =>
      url.includes("/organizations/public"),
    );
    expect(calls.length).toBeGreaterThan(0);
    const [, opts] = calls[0];
    expect(opts?.headers?.["Authorization"]).toBeUndefined();
  });

  it("maps logo_path to logoUrl", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: "c1",
          name: "Volcano Express",
          slug: "volcano",
          org_type: "bus_company",
          logo_path: "/logos/volcano.png",
          story: null,
        },
      ],
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies[0].logoUrl).toBe("/logos/volcano.png");
  });

  it("maps name to both name and shortName", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: "c1",
          name: "Volcano Express",
          slug: "volcano",
          org_type: "bus_company",
          logo_path: null,
          story: null,
        },
      ],
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const company = result.current.companies[0];
    expect(company.name).toBe("Volcano Express");
    expect(company.shortName).toBe("Volcano Express");
  });

  it("handles empty response gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies).toEqual([]);
  });

  it("loads even when no auth token is set", async () => {
    // Ensure no token is set — the hook should still call the API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          id: "c1",
          name: "Volcano Express",
          slug: "volcano",
          org_type: "bus_company",
          logo_path: null,
          story: null,
        },
      ],
    });

    const { result } = renderHook(() => useCompanies());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.companies.length).toBeGreaterThan(0);
  });
});
