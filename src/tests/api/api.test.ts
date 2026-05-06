/**
 * Tests for lib/api.ts — all fetch functions.
 * Mocks global.fetch so no real network calls are made.
 */

import {
    clearSearchHistory,
    createBooking,
    deleteSearchHistoryItem,
    fetchBookings,
    fetchCompanies,
    fetchCompany,
    fetchLocations,
    fetchPopularRoutes,
    fetchProfile,
    fetchRecommendations,
    fetchSearchHistory,
    fetchTrips,
    initiatePayment,
    saveSearchHistory,
    setAuthToken,
    updateProfile,
} from "../../../lib/api";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
  setAuthToken("test-token");
  // Default: any unmatched call (e.g. fire-and-forget audit log) returns 204
  mockFetch.mockResolvedValue({
    ok: true,
    status: 204,
    json: async () => ({}),
  });
});

function ok(body: unknown, status = 200) {
  return { ok: true, status, json: async () => body };
}
function fail(status: number) {
  return { ok: false, status, json: async () => ({}) };
}

// ─── fetchLocations ───────────────────────────────────────────────────────────

describe("fetchLocations", () => {
  it("calls GET /api/v1/locations with query param", async () => {
    mockFetch.mockResolvedValueOnce(
      ok([
        {
          id: "l1",
          name: "Kigali",
          city: "Kigali",
          code: "KGL",
          tripsToday: 5,
          popularDestinations: [],
        },
      ]),
    );
    const result = await fetchLocations("Kig");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("locations?q=Kig"),
      expect.any(Object),
    );
    expect(result[0].id).toBe("l1");
  });

  it("sends Authorization header when token is set", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    await fetchLocations("x");
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["Authorization"]).toBe("Bearer test-token");
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(fail(500));
    await expect(fetchLocations("x")).rejects.toThrow(
      "fetchLocations failed: 500",
    );
  });
});

// ─── fetchCompanies ───────────────────────────────────────────────────────────

describe("fetchCompanies", () => {
  it("returns company list", async () => {
    const companies = [
      {
        id: "c1",
        name: "Volcano Express",
        shortName: "Volcano",
        logoUrl: "🌋",
        color: "#E53E3E",
        rating: 4.8,
        totalTripsPerDay: 12,
        popular: true,
      },
    ];
    mockFetch.mockResolvedValueOnce(ok(companies));
    const result = await fetchCompanies();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Volcano Express");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/companies"),
      expect.any(Object),
    );
  });

  it("throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(fail(503));
    await expect(fetchCompanies()).rejects.toThrow(
      "fetchCompanies failed: 503",
    );
  });
});

describe("fetchCompany", () => {
  it("calls GET /api/v1/companies/:id", async () => {
    mockFetch.mockResolvedValueOnce(ok({ id: "c1", name: "Volcano Express" }));
    const result = await fetchCompany("c1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/companies/c1"),
      expect.any(Object),
    );
    expect(result.id).toBe("c1");
  });
});

// ─── fetchTrips ───────────────────────────────────────────────────────────────

describe("fetchTrips", () => {
  it("builds correct query string", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    await fetchTrips({ from: "KGL", to: "MSZ", date: "2026-04-06" });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("from=KGL");
    expect(url).toContain("to=MSZ");
    expect(url).toContain("date=2026-04-06");
  });

  it("includes operator_id when provided", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    await fetchTrips({
      from: "KGL",
      to: "MSZ",
      date: "2026-04-06",
      operatorId: "c1",
    });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("operator_id=c1");
  });

  it("forwards page and limit as query params", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    await fetchTrips({
      from: "KGL",
      to: "MSZ",
      date: "2026-04-06",
      page: 2,
      limit: 10,
    });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("page=2");
    expect(url).toContain("limit=10");
  });

  it("defaults page=1 and limit=20 when not provided", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    await fetchTrips({ from: "KGL", to: "MSZ", date: "2026-04-06" });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("page=1");
    expect(url).toContain("limit=20");
  });

  it("forwards time_from and time_to when provided", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    await fetchTrips({
      from: "KGL",
      to: "MSZ",
      date: "2026-04-06",
      timeFrom: "06:00",
      timeTo: "12:00",
    });
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("time_from=06%3A00");
    expect(url).toContain("time_to=12%3A00");
  });

  it("omits time_from and time_to when not provided", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    await fetchTrips({ from: "KGL", to: "MSZ", date: "2026-04-06" });
    const [url] = mockFetch.mock.calls[0];
    expect(url).not.toContain("time_from");
    expect(url).not.toContain("time_to");
  });

  it("handles plain array response", async () => {
    const trips = [{ id: "t1" }, { id: "t2" }];
    mockFetch.mockResolvedValueOnce(ok(trips));
    const result = await fetchTrips({
      from: "KGL",
      to: "MSZ",
      date: "2026-04-06",
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("t1");
  });

  it("handles { data, meta } envelope response", async () => {
    const trips = [{ id: "t1" }, { id: "t2" }];
    mockFetch.mockResolvedValueOnce(ok({ data: trips, meta: { total: 50 } }));
    const result = await fetchTrips({
      from: "KGL",
      to: "MSZ",
      date: "2026-04-06",
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("t1");
  });

  it("handles { data } envelope without meta", async () => {
    const trips = [{ id: "t3" }];
    mockFetch.mockResolvedValueOnce(ok({ data: trips }));
    const result = await fetchTrips({
      from: "KGL",
      to: "MSZ",
      date: "2026-04-06",
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t3");
  });

  it("throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(fail(400));
    await expect(fetchTrips({ from: "x", to: "y", date: "z" })).rejects.toThrow(
      "fetchTrips failed: 400",
    );
  });
});

// ─── fetchPopularRoutes ───────────────────────────────────────────────────────

describe("fetchPopularRoutes", () => {
  it("calls GET /api/v1/routes/popular", async () => {
    mockFetch.mockResolvedValueOnce(
      ok([
        {
          from: {},
          to: {},
          minPrice: 3000,
          currency: "RWF",
          tripsPerDay: 8,
          duration: "2h",
        },
      ]),
    );
    const result = await fetchPopularRoutes();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/routes/popular"),
      expect.any(Object),
    );
    expect(result[0].minPrice).toBe(3000);
  });
});

// ─── fetchRecommendations ─────────────────────────────────────────────────────

describe("fetchRecommendations", () => {
  it("calls GET /api/v1/recommendations", async () => {
    mockFetch.mockResolvedValueOnce(
      ok([{ trip: {}, reason: "popular", reasonLabel: "Popular" }]),
    );
    const result = await fetchRecommendations();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/recommendations"),
      expect.any(Object),
    );
    expect(result[0].reason).toBe("popular");
  });
});

// ─── Search history ───────────────────────────────────────────────────────────

describe("fetchSearchHistory", () => {
  it("calls GET /api/v1/search-history", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    await fetchSearchHistory();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/search-history"),
      expect.any(Object),
    );
  });
});

describe("saveSearchHistory", () => {
  it("calls POST /api/v1/search-history with item body", async () => {
    const saved = {
      id: "sh1",
      from: { id: "l1" },
      to: { id: "l2" },
      date: "2026-04-06",
      searchedAt: "2026-04-05T08:00:00",
    };
    mockFetch.mockResolvedValueOnce(ok(saved));
    const result = await saveSearchHistory({
      from: { id: "l1" } as any,
      to: { id: "l2" } as any,
      date: "2026-04-06",
    });
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe("POST");
    expect(result.id).toBe("sh1");
  });
});

describe("deleteSearchHistoryItem", () => {
  it("calls DELETE /api/v1/search-history/:id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    await deleteSearchHistoryItem("sh1");
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/search-history/sh1");
    expect(opts.method).toBe("DELETE");
  });
});

describe("clearSearchHistory", () => {
  it("calls DELETE /api/v1/search-history", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    await clearSearchHistory();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/search-history");
    expect(opts.method).toBe("DELETE");
  });
});

// ─── fetchBookings ────────────────────────────────────────────────────────────

describe("fetchBookings", () => {
  it("calls GET /api/v1/bookings with auth header", async () => {
    mockFetch.mockResolvedValueOnce(ok([]));
    await fetchBookings();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/bookings");
    expect(opts.headers["Authorization"]).toBe("Bearer test-token");
  });
});

// ─── createBooking ────────────────────────────────────────────────────────────

describe("createBooking", () => {
  it("posts tripId and passenger details", async () => {
    const booking = { id: "b1", bookingRef: "KAT-001", status: "confirmed" };
    mockFetch.mockResolvedValueOnce(ok(booking));
    const trip = { id: "t1" } as any;
    const passenger = {
      fullName: "Jane Doe",
      phone: "+250788000000",
      email: "jane@example.com",
    };
    const result = await createBooking(trip, passenger);
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.tripId).toBe("t1");
    expect(body.passenger.fullName).toBe("Jane Doe");
    expect(result.bookingRef).toBe("KAT-001");
  });

  it("throws on failure", async () => {
    mockFetch.mockResolvedValueOnce(fail(422));
    await expect(
      createBooking({ id: "t1" } as any, {
        fullName: "",
        phone: "",
        email: "",
      }),
    ).rejects.toThrow("createBooking failed: 422");
  });
});

// ─── initiatePayment ─────────────────────────────────────────────────────────

describe("initiatePayment", () => {
  it("posts payment payload and returns result", async () => {
    const result = {
      success: true,
      transactionId: "txn-001",
      message: "Payment successful",
    };
    mockFetch.mockResolvedValueOnce(ok(result));
    const res = await initiatePayment({
      bookingId: "b1",
      method: "momo",
      phoneNumber: "+250788000000",
    });
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/payments");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.method).toBe("momo");
    expect(body.phoneNumber).toBe("+250788000000");
    expect(res.success).toBe(true);
    expect(res.transactionId).toBe("txn-001");
  });

  it("supports card payment payload", async () => {
    mockFetch.mockResolvedValueOnce(
      ok({ success: true, transactionId: "txn-002", message: "OK" }),
    );
    await initiatePayment({
      bookingId: "b1",
      method: "card",
      card: {
        number: "4111111111111111",
        expiry: "12/28",
        cvv: "123",
        holder: "Jane Doe",
      },
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.method).toBe("card");
    expect(body.card.holder).toBe("Jane Doe");
  });

  it("throws on payment failure", async () => {
    mockFetch.mockResolvedValueOnce(fail(402));
    await expect(
      initiatePayment({ bookingId: "b1", method: "airtel" }),
    ).rejects.toThrow("initiatePayment failed: 402");
  });
});

// ─── fetchProfile / updateProfile ────────────────────────────────────────────

describe("fetchProfile", () => {
  it("calls GET /api/v1/users/me", async () => {
    mockFetch.mockResolvedValueOnce(
      ok({
        id: "u1",
        name: "Jane",
        phone: "+250788000000",
        email: "jane@example.com",
        preferences: {},
      }),
    );
    const profile = await fetchProfile();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/me"),
      expect.any(Object),
    );
    expect(profile.id).toBe("u1");
  });
});

describe("updateProfile", () => {
  it("calls PATCH /api/v1/users/me with payload", async () => {
    mockFetch.mockResolvedValueOnce(
      ok({
        id: "u1",
        name: "Jane Updated",
        phone: "+250788000000",
        email: "jane@example.com",
        preferences: {},
      }),
    );
    const result = await updateProfile({ name: "Jane Updated" });
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe("PATCH");
    expect(JSON.parse(opts.body).name).toBe("Jane Updated");
    expect(result.name).toBe("Jane Updated");
  });
});

// ─── Auth header absent when no token ────────────────────────────────────────

describe("auth header", () => {
  it("omits Authorization header when token is empty", async () => {
    setAuthToken("");
    mockFetch.mockResolvedValueOnce(ok([]));
    await fetchBookings();
    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers["Authorization"]).toBeUndefined();
    setAuthToken("test-token"); // restore
  });
});
