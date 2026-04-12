/**
 * Mock data for local development.
 * Swap EXPO_PUBLIC_USE_MOCK=true in .env.local to enable.
 * Replace with real API calls before production.
 */

import type {
    Booking,
    Company,
    Location,
    PopularRoute,
    Recommendation,
    SearchHistoryItem,
    Trip,
} from "@/lib/api";
import type { AuthResponse, AuthUser } from "./auth.service";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const DEMO_CREDENTIALS = {
  identifier: "demo@katisha.app",
  password: "Demo1234",
};

export const DEMO_USER: AuthUser = {
  id: "demo-001",
  first_name: "Demo",
  last_name: "User",
  phone_number: "+250788000000",
  email: "demo@katisha.app",
};

export const DEMO_AUTH_RESPONSE: AuthResponse = {
  access_token: "mock_access_token_dev",
  refresh_token: "mock_refresh_token_dev",
  user: DEMO_USER,
};

/** Simulates network latency */
export function mockDelay(ms = 800): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Companies ────────────────────────────────────────────────────────────────

// NOTE: logoUrl is an emoji string here for mock.
// The real API will return an HTTPS image URL — swap Image source accordingly.
export const MOCK_COMPANIES: Company[] = [
  {
    id: "c1",
    name: "Volcano Express",
    shortName: "Volcano",
    logoUrl: "🌋",
    color: "#E53E3E",
    rating: 4.8,
    totalTripsPerDay: 12,
    popular: true,
    description: "Premium express service across Rwanda",
  },
  {
    id: "c2",
    name: "Virunga Bus",
    shortName: "Virunga",
    logoUrl: "🏔️",
    color: "#38A169",
    rating: 4.6,
    totalTripsPerDay: 9,
    popular: true,
    description: "Comfortable rides to the north",
  },
  {
    id: "c3",
    name: "Kigali Coach",
    shortName: "KigCoach",
    logoUrl: "🚌",
    color: "#0A4370",
    rating: 4.5,
    totalTripsPerDay: 15,
    popular: true,
    description: "Most routes in Kigali region",
  },
  {
    id: "c4",
    name: "Rwanda Express",
    shortName: "RwExpress",
    logoUrl: "🇷🇼",
    color: "#D69E2E",
    rating: 4.3,
    totalTripsPerDay: 7,
    popular: false,
    description: "Nationwide coverage",
  },
  {
    id: "c5",
    name: "Horizon Travels",
    shortName: "Horizon",
    logoUrl: "🌅",
    color: "#805AD5",
    rating: 4.7,
    totalTripsPerDay: 11,
    popular: false,
    description: "Luxury long-distance travel",
  },
  {
    id: "c6",
    name: "Akagera Shuttle",
    shortName: "Akagera",
    logoUrl: "🦁",
    color: "#DD6B20",
    rating: 4.4,
    totalTripsPerDay: 6,
    popular: false,
    description: "Eastern Rwanda specialist",
  },
];

// ─── Locations ────────────────────────────────────────────────────────────────

export const MOCK_LOCATIONS: Location[] = [
  { id: "l1", name: "Kigali Bus Terminal", city: "Kigali", code: "KGL" },
  { id: "l2", name: "Nyabugogo Station", city: "Kigali", code: "NYB" },
  { id: "l3", name: "Musanze Bus Park", city: "Musanze", code: "MSZ" },
  { id: "l4", name: "Rubavu Border Station", city: "Rubavu", code: "RBV" },
  { id: "l5", name: "Huye Central Station", city: "Huye", code: "HUY" },
  { id: "l6", name: "Muhanga Bus Stop", city: "Muhanga", code: "MHG" },
  { id: "l7", name: "Rwamagana Station", city: "Rwamagana", code: "RWM" },
  { id: "l8", name: "Kayonza Bus Park", city: "Kayonza", code: "KYZ" },
  { id: "l9", name: "Rusizi Border Post", city: "Rusizi", code: "RSZ" },
  { id: "l10", name: "Nyagatare Bus Terminal", city: "Nyagatare", code: "NGT" },
  { id: "l11", name: "Gisenyi Town Station", city: "Gisenyi", code: "GSY" },
  { id: "l12", name: "Butare University Stop", city: "Butare", code: "BTR" },
];

// ─── Trips ────────────────────────────────────────────────────────────────────

export const MOCK_TRIPS: Trip[] = [
  {
    id: "t1",
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[2],
    departureTime: "2026-04-06T06:00:00",
    arrivalTime: "2026-04-06T08:30:00",
    duration: "2h 30m",
    operator: "Volcano Express",
    operatorId: "c1",
    price: 3500,
    currency: "RWF",
    seatsAvailable: 14,
    busType: "Luxury Coach",
  },
  {
    id: "t2",
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[2],
    departureTime: "2026-04-06T08:00:00",
    arrivalTime: "2026-04-06T10:30:00",
    duration: "2h 30m",
    operator: "Virunga Bus",
    operatorId: "c2",
    price: 3000,
    currency: "RWF",
    seatsAvailable: 6,
    busType: "Standard",
  },
  {
    id: "t3",
    from: MOCK_LOCATIONS[1],
    to: MOCK_LOCATIONS[4],
    departureTime: "2026-04-06T07:00:00",
    arrivalTime: "2026-04-06T09:45:00",
    duration: "2h 45m",
    operator: "Kigali Coach",
    operatorId: "c3",
    price: 2800,
    currency: "RWF",
    seatsAvailable: 22,
    busType: "Express",
  },
  {
    id: "t4",
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[3],
    departureTime: "2026-04-06T09:30:00",
    arrivalTime: "2026-04-06T11:00:00",
    duration: "1h 30m",
    operator: "Rwanda Express",
    operatorId: "c4",
    price: 2500,
    currency: "RWF",
    seatsAvailable: 3,
    busType: "Mini Bus",
  },
  {
    id: "t5",
    from: MOCK_LOCATIONS[1],
    to: MOCK_LOCATIONS[9],
    departureTime: "2026-04-06T05:30:00",
    arrivalTime: "2026-04-06T09:00:00",
    duration: "3h 30m",
    operator: "Horizon Travels",
    operatorId: "c5",
    price: 4200,
    currency: "RWF",
    seatsAvailable: 18,
    busType: "Luxury Coach",
  },
  {
    id: "t6",
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[8],
    departureTime: "2026-04-06T06:30:00",
    arrivalTime: "2026-04-06T10:30:00",
    duration: "4h 00m",
    operator: "Akagera Shuttle",
    operatorId: "c6",
    price: 5000,
    currency: "RWF",
    seatsAvailable: 9,
    busType: "Express",
  },
];

// ─── Past bookings (for recommendations) ─────────────────────────────────────

export const MOCK_PAST_BOOKINGS: Booking[] = [
  {
    id: "b1",
    trip: MOCK_TRIPS[0],
    passenger: {
      fullName: "Demo User",
      phone: "+250788000000",
      email: "demo@katisha.app",
    },
    seatNumber: "12A",
    bookingRef: "KAT-001",
    status: "confirmed",
    bookedAt: "2026-03-20T10:00:00",
    totalPaid: 3500,
    currency: "RWF",
  },
  {
    id: "b2",
    trip: MOCK_TRIPS[2],
    passenger: {
      fullName: "Demo User",
      phone: "+250788000000",
      email: "demo@katisha.app",
    },
    seatNumber: "5B",
    bookingRef: "KAT-002",
    status: "confirmed",
    bookedAt: "2026-03-10T08:30:00",
    totalPaid: 2800,
    currency: "RWF",
  },
];

// ─── Search history ───────────────────────────────────────────────────────────

export const MOCK_SEARCH_HISTORY: SearchHistoryItem[] = [
  {
    id: "sh1",
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[2],
    date: "2026-04-06",
    searchedAt: "2026-04-05T08:00:00",
  },
  {
    id: "sh2",
    from: MOCK_LOCATIONS[1],
    to: MOCK_LOCATIONS[4],
    date: "2026-03-28",
    searchedAt: "2026-03-27T14:30:00",
  },
  {
    id: "sh3",
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[8],
    date: "2026-03-15",
    searchedAt: "2026-03-14T09:00:00",
  },
];

// ─── Popular routes ───────────────────────────────────────────────────────────

export const MOCK_POPULAR_ROUTES: PopularRoute[] = [
  {
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[2],
    minPrice: 3000,
    currency: "RWF",
    tripsPerDay: 8,
    duration: "2h 30m",
  },
  {
    from: MOCK_LOCATIONS[1],
    to: MOCK_LOCATIONS[4],
    minPrice: 2800,
    currency: "RWF",
    tripsPerDay: 6,
    duration: "2h 45m",
  },
  {
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[3],
    minPrice: 2500,
    currency: "RWF",
    tripsPerDay: 5,
    duration: "1h 30m",
  },
  {
    from: MOCK_LOCATIONS[1],
    to: MOCK_LOCATIONS[9],
    minPrice: 4200,
    currency: "RWF",
    tripsPerDay: 4,
    duration: "3h 30m",
  },
];

// ─── Recommendations ─────────────────────────────────────────────────────────

export function getMockRecommendations(): Recommendation[] {
  return [
    {
      trip: MOCK_TRIPS[0],
      reason: "past_route",
      reasonLabel: "You've taken this route before",
    },
    {
      trip: MOCK_TRIPS[2],
      reason: "past_route",
      reasonLabel: "Frequent route",
    },
    {
      trip: MOCK_TRIPS[4],
      reason: "popular",
      reasonLabel: "Popular this week",
    },
    { trip: MOCK_TRIPS[5], reason: "popular", reasonLabel: "Trending route" },
  ];
}

// ─── Location autocomplete ────────────────────────────────────────────────────

export function getMockLocationSuggestions(
  query: string,
): import("@/lib/api").LocationSuggestion[] {
  const q = query.toLowerCase();
  return MOCK_LOCATIONS.filter(
    (l) => l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q),
  )
    .slice(0, 6)
    .map((l) => ({
      ...l,
      tripsToday: Math.floor(Math.random() * 20) + 2,
      popularDestinations: MOCK_LOCATIONS.filter((d) => d.id !== l.id)
        .slice(0, 2)
        .map((d) => d.city),
    }));
}
