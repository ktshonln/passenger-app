/**
 * Tests for hooks/use-trips.ts
 * Covers: reset, loadMore, hasMore, retry, error, loadingMore state
 */
import { act, renderHook } from "@testing-library/react-native";
import { useTrips } from "../../../hooks/use-trips";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const PARAMS = { from: "KGL", to: "MSZ", date: "2026-04-06" };

function makeTrips(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `t${i}`,
    from: { id: "l1", name: "Kigali", city: "Kigali", code: "KGL" },
    to: { id: "l2", name: "Musanze", city: "Musanze", code: "MSZ" },
    departureTime: "2026-04-06T08:00:00",
    arrivalTime: "2026-04-06T10:00:00",
    duration: "2h",
    operator: "Volcano Express",
    operatorId: "c1",
    price: 3000,
    currency: "RWF",
    seatsAvailable: 10,
    busType: "Express",
  }));
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

beforeEach(() => {
  mockFetch.mockClear();
  // Default: audit log call returns 204
  mockFetch.mockResolvedValue({
    ok: true,
    status: 204,
    json: async () => ({}),
  });
});

describe("useTrips", () => {
  it("search() resets page to 1 and clears previous results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    }); // audit
    mockFetch.mockResolvedValueOnce(okResponse(makeTrips(5)));

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.search(PARAMS);
    });

    expect(result.current.trips).toHaveLength(5);
    expect(result.current.page).toBe(1);
    expect(result.current.searched).toBe(true);
  });

  it("loadMore() appends results and increments page", async () => {
    // First search: 20 trips (full page → hasMore = true)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
    mockFetch.mockResolvedValueOnce(okResponse(makeTrips(20)));
    // loadMore: 5 more trips
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
    mockFetch.mockResolvedValueOnce(okResponse(makeTrips(5)));

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.search(PARAMS);
    });

    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.trips.length).toBeGreaterThan(20);
    expect(result.current.page).toBe(2);
  });

  it("hasMore is false when API returns < 20 results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
    mockFetch.mockResolvedValueOnce(okResponse(makeTrips(7)));

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.search(PARAMS);
    });

    expect(result.current.hasMore).toBe(false);
  });

  it("hasMore is true when API returns exactly 20 results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
    mockFetch.mockResolvedValueOnce(okResponse(makeTrips(20)));

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.search(PARAMS);
    });

    expect(result.current.hasMore).toBe(true);
  });

  it("retry() re-calls fetch with lastParams", async () => {
    // Initial search fails
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    // Retry succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
    mockFetch.mockResolvedValueOnce(okResponse(makeTrips(3)));

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.search(PARAMS);
    });

    expect(result.current.error).not.toBeNull();

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.trips).toHaveLength(3);
    expect(result.current.error).toBeNull();
  });

  it("sets error on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
    mockFetch.mockRejectedValueOnce(new Error("500 error"));

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.search(PARAMS);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.trips).toHaveLength(0);
  });

  it("loadingMore is true during loadMore fetch", async () => {
    let resolveLoadMore!: (v: unknown) => void;
    const loadMorePromise = new Promise((res) => {
      resolveLoadMore = res;
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
    mockFetch.mockResolvedValueOnce(okResponse(makeTrips(20)));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => ({}),
    });
    mockFetch.mockReturnValueOnce(
      loadMorePromise.then(() => okResponse(makeTrips(5))),
    );

    const { result } = renderHook(() => useTrips());

    await act(async () => {
      await result.current.search(PARAMS);
    });

    act(() => {
      result.current.loadMore();
    });

    expect(result.current.loadingMore).toBe(true);

    await act(async () => {
      resolveLoadMore(undefined);
    });
  });
});
