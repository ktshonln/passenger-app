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
    Trip
} from "@/lib/api";
import type { AuthResponse, AuthUser } from "./auth.service";
import type { TripDetail } from "./trip.service";

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
    from: MOCK_LOCATIONS[0], // Kigali Bus Terminal
    to: MOCK_LOCATIONS[2], // Musanze Bus Park
    minPrice: 3000,
    currency: "RWF",
    tripsPerDay: 8,
    duration: "2h 30m",
    stops: [
      {
        id: "l1",
        name: "Kigali Bus Terminal",
        city: "Kigali",
        code: "KGL",
        timeFromOrigin: "0 min",
        distanceFromOrigin: "0 km",
        priceFromOrigin: 0,
      },
      {
        id: "ls1",
        name: "Rulindo Bus Stop",
        city: "Rulindo",
        code: "RLD",
        timeFromOrigin: "40 min",
        distanceFromOrigin: "45 km",
        priceFromOrigin: 1200,
      },
      {
        id: "ls2",
        name: "Gakenke Stage",
        city: "Gakenke",
        code: "GKK",
        timeFromOrigin: "1h 10m",
        distanceFromOrigin: "80 km",
        priceFromOrigin: 1800,
      },
      {
        id: "ls3",
        name: "Musanze Bus Park",
        city: "Musanze",
        code: "MSZ",
        timeFromOrigin: "2h 30m",
        distanceFromOrigin: "120 km",
        priceFromOrigin: 3000,
      },
    ],
  },
  {
    from: MOCK_LOCATIONS[1], // Nyabugogo Station
    to: MOCK_LOCATIONS[4], // Huye Central Station
    minPrice: 2800,
    currency: "RWF",
    tripsPerDay: 6,
    duration: "2h 45m",
    stops: [
      {
        id: "l2",
        name: "Nyabugogo Station",
        city: "Kigali",
        code: "NYB",
        timeFromOrigin: "0 min",
        distanceFromOrigin: "0 km",
        priceFromOrigin: 0,
      },
      {
        id: "ls4",
        name: "Muhanga Bus Stop",
        city: "Muhanga",
        code: "MHG",
        timeFromOrigin: "45 min",
        distanceFromOrigin: "50 km",
        priceFromOrigin: 1000,
      },
      {
        id: "ls5",
        name: "Ruhango Stage",
        city: "Ruhango",
        code: "RHG",
        timeFromOrigin: "1h 20m",
        distanceFromOrigin: "85 km",
        priceFromOrigin: 1600,
      },
      {
        id: "ls6",
        name: "Nyanza Bus Park",
        city: "Nyanza",
        code: "NYZ",
        timeFromOrigin: "1h 50m",
        distanceFromOrigin: "110 km",
        priceFromOrigin: 2200,
      },
      {
        id: "l5",
        name: "Huye Central Station",
        city: "Huye",
        code: "HUY",
        timeFromOrigin: "2h 45m",
        distanceFromOrigin: "140 km",
        priceFromOrigin: 2800,
      },
    ],
  },
  {
    from: MOCK_LOCATIONS[0], // Kigali Bus Terminal
    to: MOCK_LOCATIONS[3], // Rubavu Border Station
    minPrice: 2500,
    currency: "RWF",
    tripsPerDay: 5,
    duration: "1h 30m",
    stops: [
      {
        id: "l1",
        name: "Kigali Bus Terminal",
        city: "Kigali",
        code: "KGL",
        timeFromOrigin: "0 min",
        distanceFromOrigin: "0 km",
        priceFromOrigin: 0,
      },
      {
        id: "ls7",
        name: "Muhanga Stage",
        city: "Muhanga",
        code: "MHG",
        timeFromOrigin: "45 min",
        distanceFromOrigin: "55 km",
        priceFromOrigin: 900,
      },
      {
        id: "l4",
        name: "Rubavu Border Station",
        city: "Rubavu",
        code: "RBV",
        timeFromOrigin: "1h 30m",
        distanceFromOrigin: "160 km",
        priceFromOrigin: 2500,
      },
    ],
  },
  {
    from: MOCK_LOCATIONS[1], // Nyabugogo Station
    to: MOCK_LOCATIONS[9], // Nyagatare Bus Terminal
    minPrice: 4200,
    currency: "RWF",
    tripsPerDay: 4,
    duration: "3h 30m",
    stops: [
      {
        id: "l2",
        name: "Nyabugogo Station",
        city: "Kigali",
        code: "NYB",
        timeFromOrigin: "0 min",
        distanceFromOrigin: "0 km",
        priceFromOrigin: 0,
      },
      {
        id: "ls8",
        name: "Rwamagana Station",
        city: "Rwamagana",
        code: "RWM",
        timeFromOrigin: "50 min",
        distanceFromOrigin: "55 km",
        priceFromOrigin: 1200,
      },
      {
        id: "ls9",
        name: "Kayonza Bus Park",
        city: "Kayonza",
        code: "KYZ",
        timeFromOrigin: "1h 20m",
        distanceFromOrigin: "90 km",
        priceFromOrigin: 1800,
      },
      {
        id: "ls10",
        name: "Nyagatare Bus Terminal",
        city: "Nyagatare",
        code: "NGT",
        timeFromOrigin: "3h 30m",
        distanceFromOrigin: "190 km",
        priceFromOrigin: 4200,
      },
    ],
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

// ─── Trip Details ─────────────────────────────────────────────────────────────

export const MOCK_TRIP_DETAILS: Record<string, TripDetail> = {
  t1: {
    id: "t1",
    series_id: "series1",
    route_id: "route1",
    org_id: "c1",
    bus_id: "bus1",
    driver_id: "driver1",
    departure_at: "2026-04-06T06:00:00Z",
    available_seats: 14,
    total_seats: 30,
    status: "scheduled",
    is_express: false,
    cancellation_allowed: true,
    currency: "RWF",
    route: {
      id: "route1",
      org_id: "c1",
      name: "Kigali – Musanze",
      is_active: true,
      route_stops: [
        { order: 1, stop: { id: "s1", name: "Kigali", lat: -1.9441, lng: 30.0619, city: "Kigali" } },
        { order: 2, stop: { id: "s2", name: "Rulindo", lat: -1.7833, lng: 30.0667, city: "Rulindo" } },
        { order: 3, stop: { id: "s3", name: "Musanze", lat: -1.4989, lng: 29.634, city: "Musanze" } },
      ]
    },
    bus: {
      id: "bus1",
      org_id: "c1",
      plate: "RAA 001 A",
      type: "Luxury Coach",
      total_seats: 30,
      is_active: true
    },
    company: {
      id: "c1",
      name: "Volcano Express",
      logo_path: "🌋",
      story: "Premium express service across Rwanda with comfortable seats and professional drivers",
    }
  },
  t2: {
    id: "t2",
    series_id: "series2",
    route_id: "route2",
    org_id: "c2",
    bus_id: "bus2",
    driver_id: "driver2",
    departure_at: "2026-04-06T08:00:00Z",
    available_seats: 6,
    total_seats: 25,
    status: "scheduled",
    is_express: false,
    cancellation_allowed: true,
    currency: "RWF",
    route: {
      id: "route2",
      org_id: "c2",
      name: "Kigali – Musanze Regular",
      is_active: true,
      route_stops: [
        { order: 1, stop: { id: "s4", name: "Kigali", lat: -1.9441, lng: 30.0619, city: "Kigali" } },
        { order: 2, stop: { id: "s5", name: "Rulindo", lat: -1.7833, lng: 30.0667, city: "Rulindo" } },
        { order: 3, stop: { id: "s6", name: "Musanze", lat: -1.4989, lng: 29.634, city: "Musanze" } },
      ]
    },
    bus: {
      id: "bus2",
      org_id: "c2",
      plate: "RAB 123 B",
      type: "Standard",
      total_seats: 25,
      is_active: true
    },
    company: {
      id: "c2",
      name: "Virunga Bus",
      logo_path: "🏔️",
      story: "Comfortable rides to the north with affordable prices and reliable service",
    }
  },
  t3: {
    id: "t3",
    series_id: "series3",
    route_id: "route3",
    org_id: "c3",
    bus_id: "bus3",
    driver_id: "driver3",
    departure_at: "2026-04-06T07:00:00Z",
    available_seats: 22,
    total_seats: 30,
    status: "scheduled",
    is_express: true,
    cancellation_allowed: true,
    currency: "RWF",
    route: {
      id: "route3",
      org_id: "c3",
      name: "Nyabugogo – Huye Express",
      is_active: true,
      route_stops: [
        { order: 1, stop: { id: "l2", name: "Nyabugogo", lat: -1.9536, lng: 30.0606, city: "Kigali" } },
        { order: 2, stop: { id: "l5", name: "Huye", lat: -2.5967, lng: 29.7389, city: "Huye" } },
      ]
    },
    bus: {
      id: "bus3",
      org_id: "c3",
      plate: "RAC 456 C",
      type: "Express",
      total_seats: 30,
      is_active: true
    },
    company: {
      id: "c3",
      name: "Kigali Coach",
      logo_path: "🚌",
      story: "Most routes in Kigali region with express and standard services",
    }
  },
  t4: {
    id: "t4",
    series_id: "series4",
    route_id: "route4",
    org_id: "c4",
    bus_id: "bus4",
    driver_id: "driver4",
    departure_at: "2026-04-06T09:30:00Z",
    available_seats: 3,
    total_seats: 15,
    status: "scheduled",
    is_express: false,
    cancellation_allowed: true,
    currency: "RWF",
    route: {
      id: "route4",
      org_id: "c4",
      name: "Kigali – Rubavu Regular",
      is_active: true,
      route_stops: [
        { order: 1, stop: { id: "s7", name: "Kigali", lat: -1.9441, lng: 30.0619, city: "Kigali" } },
        { order: 2, stop: { id: "s8", name: "Muhanga", lat: -2.0833, lng: 29.7333, city: "Muhanga" } },
        { order: 3, stop: { id: "s9", name: "Rubavu", lat: -1.6778, lng: 29.2603, city: "Rubavu" } },
      ]
    },
    bus: {
      id: "bus4",
      org_id: "c4",
      plate: "RAD 789 D",
      type: "Mini Bus",
      total_seats: 15,
      is_active: true
    },
    company: {
      id: "c4",
      name: "Rwanda Express",
      logo_path: "🇷🇼",
      story: "Nationwide coverage with affordable prices and flexible schedules",
    }
  },
};

export interface PriceResponse {
  boarding_stop_id: string;
  alighting_stop_id: string;
  amount: number;
  currency: string;
}

export function getMockPrice(
  boardingStopId: string,
  alightingStopId: string,
): PriceResponse | null {
  // Simple mock pricing based on stop order difference
  const prices: Record<string, number> = {
    "s1-s2": 1500,
    "s1-s3": 3500,
    "s2-s3": 2000,
    "s4-s5": 1500,
    "s4-s6": 3000,
    "s5-s6": 1800,
    "s7-s8": 2000,
    "s7-s9": 2500,
    "s8-s9": 1000,
    "s10-s11": 1500,
    "s10-s12": 5000,
    "s11-s12": 3500,
    // Express trips (origin to destination only)
    "l2-l5": 2800,
    "l1-l3": 3500,
    "l1-l4": 2500,
    "l2-l10": 4200,
  };

  const key = `${boardingStopId}-${alightingStopId}`;
  const amount = prices[key];

  if (!amount) {
    return null;
  }

  return {
    boarding_stop_id: boardingStopId,
    alighting_stop_id: alightingStopId,
    amount,
    currency: "RWF",
  };
}

export interface WalletBalance {
  available: number;
  currency: string;
}

export const MOCK_WALLET_BALANCE: WalletBalance = {
  available: 5000,
  currency: "RWF",
};
