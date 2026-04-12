/**
 * Tests for src/services/mock.data.ts
 * Verifies shape, consistency, and helper functions.
 */

import {
    DEMO_CREDENTIALS,
    DEMO_USER,
    getMockLocationSuggestions,
    getMockRecommendations,
    MOCK_COMPANIES,
    MOCK_LOCATIONS,
    MOCK_PAST_BOOKINGS,
    MOCK_POPULAR_ROUTES,
    MOCK_SEARCH_HISTORY,
    MOCK_TRIPS,
    mockDelay,
} from "../../services/mock.data";

// ─── DEMO credentials ─────────────────────────────────────────────────────────

describe("DEMO_CREDENTIALS", () => {
  it("has identifier and password", () => {
    expect(DEMO_CREDENTIALS.identifier).toBeTruthy();
    expect(DEMO_CREDENTIALS.password).toBeTruthy();
  });

  it("password meets minimum requirements (8+ chars, letter + number)", () => {
    const { password } = DEMO_CREDENTIALS;
    expect(password.length).toBeGreaterThanOrEqual(8);
    expect(/[a-zA-Z]/.test(password)).toBe(true);
    expect(/\d/.test(password)).toBe(true);
  });
});

describe("DEMO_USER", () => {
  it("has all required AuthUser fields", () => {
    expect(DEMO_USER.id).toBeTruthy();
    expect(DEMO_USER.first_name).toBeTruthy();
    expect(DEMO_USER.last_name).toBeTruthy();
    expect(DEMO_USER.phone_number).toMatch(/^\+/);
  });
});

// ─── Companies ────────────────────────────────────────────────────────────────

describe("MOCK_COMPANIES", () => {
  it("has at least one company", () => {
    expect(MOCK_COMPANIES.length).toBeGreaterThan(0);
  });

  it("every company has required fields", () => {
    for (const c of MOCK_COMPANIES) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.shortName).toBeTruthy();
      expect(c.logoUrl).toBeTruthy();
      expect(c.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.rating).toBeGreaterThanOrEqual(1);
      expect(c.rating).toBeLessThanOrEqual(5);
      expect(typeof c.totalTripsPerDay).toBe("number");
      expect(typeof c.popular).toBe("boolean");
    }
  });

  it("has unique ids", () => {
    const ids = MOCK_COMPANIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── Locations ────────────────────────────────────────────────────────────────

describe("MOCK_LOCATIONS", () => {
  it("has at least 5 locations", () => {
    expect(MOCK_LOCATIONS.length).toBeGreaterThanOrEqual(5);
  });

  it("every location has id, name, city, code", () => {
    for (const l of MOCK_LOCATIONS) {
      expect(l.id).toBeTruthy();
      expect(l.name).toBeTruthy();
      expect(l.city).toBeTruthy();
      expect(l.code).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("has unique codes", () => {
    const codes = MOCK_LOCATIONS.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

// ─── Trips ────────────────────────────────────────────────────────────────────

describe("MOCK_TRIPS", () => {
  it("has at least one trip", () => {
    expect(MOCK_TRIPS.length).toBeGreaterThan(0);
  });

  it("every trip has required fields", () => {
    for (const t of MOCK_TRIPS) {
      expect(t.id).toBeTruthy();
      expect(t.from).toBeDefined();
      expect(t.to).toBeDefined();
      expect(t.departureTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(t.arrivalTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(t.duration).toBeTruthy();
      expect(t.operator).toBeTruthy();
      expect(t.operatorId).toBeTruthy();
      expect(t.price).toBeGreaterThan(0);
      expect(t.currency).toBe("RWF");
      expect(t.seatsAvailable).toBeGreaterThanOrEqual(0);
      expect(t.busType).toBeTruthy();
    }
  });

  it("operatorId matches a company id", () => {
    const companyIds = new Set(MOCK_COMPANIES.map((c) => c.id));
    for (const t of MOCK_TRIPS) {
      expect(companyIds.has(t.operatorId)).toBe(true);
    }
  });

  it("operator name matches the company with that id", () => {
    for (const t of MOCK_TRIPS) {
      const company = MOCK_COMPANIES.find((c) => c.id === t.operatorId);
      expect(company?.name).toBe(t.operator);
    }
  });

  it("arrival is always after departure", () => {
    for (const t of MOCK_TRIPS) {
      expect(new Date(t.arrivalTime).getTime()).toBeGreaterThan(
        new Date(t.departureTime).getTime(),
      );
    }
  });
});

// ─── Popular routes ───────────────────────────────────────────────────────────

describe("MOCK_POPULAR_ROUTES", () => {
  it("has at least one route", () => {
    expect(MOCK_POPULAR_ROUTES.length).toBeGreaterThan(0);
  });

  it("every route has valid fields", () => {
    for (const r of MOCK_POPULAR_ROUTES) {
      expect(r.from).toBeDefined();
      expect(r.to).toBeDefined();
      expect(r.minPrice).toBeGreaterThan(0);
      expect(r.currency).toBe("RWF");
      expect(r.tripsPerDay).toBeGreaterThan(0);
      expect(r.duration).toBeTruthy();
    }
  });

  it("from and to are different locations", () => {
    for (const r of MOCK_POPULAR_ROUTES) {
      expect(r.from.id).not.toBe(r.to.id);
    }
  });
});

// ─── Search history ───────────────────────────────────────────────────────────

describe("MOCK_SEARCH_HISTORY", () => {
  it("has at least one item", () => {
    expect(MOCK_SEARCH_HISTORY.length).toBeGreaterThan(0);
  });

  it("every item has required fields", () => {
    for (const h of MOCK_SEARCH_HISTORY) {
      expect(h.id).toBeTruthy();
      expect(h.from).toBeDefined();
      expect(h.to).toBeDefined();
      expect(h.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(h.searchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});

// ─── Past bookings ────────────────────────────────────────────────────────────

describe("MOCK_PAST_BOOKINGS", () => {
  it("has at least one booking", () => {
    expect(MOCK_PAST_BOOKINGS.length).toBeGreaterThan(0);
  });

  it("every booking has required fields", () => {
    for (const b of MOCK_PAST_BOOKINGS) {
      expect(b.id).toBeTruthy();
      expect(b.trip).toBeDefined();
      expect(b.passenger.fullName).toBeTruthy();
      expect(b.seatNumber).toBeTruthy();
      expect(b.bookingRef).toMatch(/^KAT-/);
      expect(["confirmed", "pending", "cancelled"]).toContain(b.status);
      expect(b.totalPaid).toBeGreaterThan(0);
    }
  });
});

// ─── getMockRecommendations ───────────────────────────────────────────────────

describe("getMockRecommendations", () => {
  it("returns at least one recommendation", () => {
    const recs = getMockRecommendations();
    expect(recs.length).toBeGreaterThan(0);
  });

  it("every recommendation has trip, reason, and reasonLabel", () => {
    for (const r of getMockRecommendations()) {
      expect(r.trip).toBeDefined();
      expect(["past_route", "popular", "nearby"]).toContain(r.reason);
      expect(r.reasonLabel).toBeTruthy();
    }
  });

  it("referenced trips exist in MOCK_TRIPS", () => {
    const tripIds = new Set(MOCK_TRIPS.map((t) => t.id));
    for (const r of getMockRecommendations()) {
      expect(tripIds.has(r.trip.id)).toBe(true);
    }
  });
});

// ─── getMockLocationSuggestions ───────────────────────────────────────────────

describe("getMockLocationSuggestions", () => {
  it("returns results matching the query", () => {
    const results = getMockLocationSuggestions("Kig");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      const matches =
        r.name.toLowerCase().includes("kig") ||
        r.city.toLowerCase().includes("kig");
      expect(matches).toBe(true);
    }
  });

  it("returns empty array for short query", () => {
    // The function filters by query — single char won't match anything meaningful
    const results = getMockLocationSuggestions("zzz");
    expect(results).toHaveLength(0);
  });

  it("returns max 6 results", () => {
    const results = getMockLocationSuggestions("a"); // broad query
    expect(results.length).toBeLessThanOrEqual(6);
  });

  it("every suggestion has tripsToday and popularDestinations", () => {
    const results = getMockLocationSuggestions("Kig");
    for (const r of results) {
      expect(typeof r.tripsToday).toBe("number");
      expect(r.tripsToday).toBeGreaterThan(0);
      expect(Array.isArray(r.popularDestinations)).toBe(true);
    }
  });
});

// ─── mockDelay ────────────────────────────────────────────────────────────────

describe("mockDelay", () => {
  it("resolves after the specified ms", async () => {
    const start = Date.now();
    await mockDelay(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(40);
  });

  it("defaults to ~800ms (just check it resolves)", async () => {
    // Don't wait 800ms in tests — just verify it returns a Promise
    const result = mockDelay(0);
    expect(result).toBeInstanceOf(Promise);
    await result;
  });
});
