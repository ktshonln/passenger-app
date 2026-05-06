/**
 * Tests for hooks/use-locations.ts
 * Covers: debounce, abort, cache hit, error state, clear
 */
import { act, renderHook } from "@testing-library/react-native";
import { useLocations } from "../../../hooks/use-locations";
import * as locationCache from "../../../lib/location-cache";

jest.mock("../../../lib/location-cache");

const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_RESULTS = [
  {
    id: "l1",
    name: "Kigali",
    city: "Kigali",
    code: "KGL",
    tripsToday: 5,
    popularDestinations: ["Musanze"],
  },
];

function okResponse(body: unknown) {
  return { ok: true, json: async () => body };
}

beforeEach(() => {
  jest.useFakeTimers();
  mockFetch.mockClear();
  (locationCache.get as jest.Mock).mockReturnValue(null);
  (locationCache.set as jest.Mock).mockImplementation(() => {});
  (locationCache.clear as jest.Mock).mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useLocations", () => {
  it("does not fetch when query < 2 chars", async () => {
    renderHook(() => useLocations("K"));
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("debounces — only one fetch after rapid changes", async () => {
    mockFetch.mockResolvedValue(okResponse(MOCK_RESULTS));
    const { rerender } = renderHook(({ q }) => useLocations(q), {
      initialProps: { q: "Ki" },
    });
    rerender({ q: "Kig" });
    rerender({ q: "Kiga" });
    rerender({ q: "Kigal" });
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("aborts previous request when query changes", async () => {
    const abortMock = jest.fn();
    const originalAbortController = global.AbortController;
    (global as any).AbortController = jest.fn(() => ({
      abort: abortMock,
      signal: {},
    }));

    mockFetch.mockResolvedValue(okResponse(MOCK_RESULTS));

    const { rerender } = renderHook(({ q }) => useLocations(q), {
      initialProps: { q: "Ki" },
    });
    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    rerender({ q: "Mu" });
    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(abortMock).toHaveBeenCalled();
    (global as any).AbortController = originalAbortController;
  });

  it("returns cached result without fetching", async () => {
    (locationCache.get as jest.Mock).mockReturnValue(MOCK_RESULTS);

    const { result } = renderHook(() => useLocations("Kig"));
    await act(async () => {
      jest.advanceTimersByTime(10);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.results).toEqual(MOCK_RESULTS);
  });

  it("sets error state on fetch failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useLocations("Kig"));
    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(result.current.error).not.toBeNull();
  });

  it("clears results when query is cleared", async () => {
    mockFetch.mockResolvedValue(okResponse(MOCK_RESULTS));

    const { result, rerender } = renderHook(({ q }) => useLocations(q), {
      initialProps: { q: "Kig" },
    });
    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    rerender({ q: "" });
    await act(async () => {
      jest.advanceTimersByTime(10);
    });

    expect(result.current.results).toEqual([]);
  });
});
