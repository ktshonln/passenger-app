const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.katisha.app";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Location {
  id: string;
  name: string;
  city: string;
  code: string;
}

export interface Trip {
  id: string;
  from: Location;
  to: Location;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  operator: string;
  price: number;
  currency: string;
  seatsAvailable: number;
  busType: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_LOCATIONS: Location[] = [
  { id: "1", name: "Nairobi CBD Bus Terminal", city: "Nairobi", code: "NBI" },
  { id: "2", name: "Nairobi Westlands Stage", city: "Nairobi", code: "NBI-W" },
  { id: "3", name: "Mombasa Likoni Ferry", city: "Mombasa", code: "MBA" },
  { id: "4", name: "Mombasa Town Bus Park", city: "Mombasa", code: "MBA-T" },
  { id: "5", name: "Kisumu Bus Terminal", city: "Kisumu", code: "KSM" },
  { id: "6", name: "Nakuru Bus Park", city: "Nakuru", code: "NKR" },
  { id: "7", name: "Eldoret Bus Terminal", city: "Eldoret", code: "ELD" },
  { id: "8", name: "Thika Bus Stage", city: "Thika", code: "THK" },
  { id: "9", name: "Nyeri Bus Park", city: "Nyeri", code: "NYR" },
  { id: "10", name: "Malindi Bus Terminal", city: "Malindi", code: "MLD" },
];

const MOCK_TRIPS: Trip[] = [
  {
    id: "t1",
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[2],
    departureTime: "07:00",
    arrivalTime: "13:30",
    duration: "6h 30m",
    operator: "Modern Coast",
    price: 1200,
    currency: "KES",
    seatsAvailable: 14,
    busType: "Executive",
  },
  {
    id: "t2",
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[2],
    departureTime: "09:00",
    arrivalTime: "15:00",
    duration: "6h 00m",
    operator: "Dreamline Express",
    price: 1000,
    currency: "KES",
    seatsAvailable: 3,
    busType: "Standard",
  },
  {
    id: "t3",
    from: MOCK_LOCATIONS[0],
    to: MOCK_LOCATIONS[4],
    departureTime: "06:30",
    arrivalTime: "12:00",
    duration: "5h 30m",
    operator: "Easy Coach",
    price: 900,
    currency: "KES",
    seatsAvailable: 22,
    busType: "Standard",
  },
];

// ─── API Helpers ──────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

function logAudit(
  action: string,
  resource: string,
  meta: Record<string, unknown>,
) {
  const entry = {
    action,
    resource,
    meta,
    timestamp: new Date().toISOString(),
  };
  // Send to audit endpoint fire-and-forget; falls back to console in dev
  fetch(`${BASE_URL}/api/v1/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  }).catch(() => {
    if (__DEV__) console.log("[AUDIT]", JSON.stringify(entry));
  });
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function fetchLocations(query: string): Promise<Location[]> {
  try {
    const data = await get<Location[]>(
      `/api/v1/locations?q=${encodeURIComponent(query)}`,
    );
    return data;
  } catch {
    // Fall back to mock data filtered by query
    const q = query.toLowerCase();
    return MOCK_LOCATIONS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q),
    );
  }
}

export interface TripSearchParams {
  from: string;
  to: string;
  date: string;
  operator?: string;
}

// ─── Booking Types ────────────────────────────────────────────────────────────

export interface PassengerDetails {
  fullName: string;
  phone: string;
  email: string;
}

export interface Booking {
  id: string;
  trip: Trip;
  passenger: PassengerDetails;
  seatNumber: string;
  bookingRef: string;
  status: "confirmed" | "pending" | "cancelled";
  bookedAt: string;
  totalPaid: number;
  currency: string;
}

export async function createBooking(
  trip: Trip,
  passenger: PassengerDetails,
): Promise<Booking> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId: trip.id, passenger }),
    });
    if (!res.ok) throw new Error("Booking failed");
    return res.json();
  } catch {
    // Mock booking response
    await new Promise((r) => setTimeout(r, 1200));
    const seat = `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 10) + 1}`;
    return {
      id: `b-${Date.now()}`,
      trip,
      passenger,
      seatNumber: seat,
      bookingRef: `KT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: "confirmed",
      bookedAt: new Date().toISOString(),
      totalPaid: trip.price,
      currency: trip.currency,
    };
  }
}

export async function fetchTrips(params: TripSearchParams): Promise<Trip[]> {
  logAudit("SEARCH", "TRIP", { query_params: params });
  try {
    const qs = new URLSearchParams({
      from: params.from,
      to: params.to,
      date: params.date,
      ...(params.operator ? { operator: params.operator } : {}),
    });
    const data = await get<Trip[]>(`/api/v1/trips?${qs}`);
    return data;
  } catch {
    // Fall back to mock data
    await new Promise((r) => setTimeout(r, 800)); // simulate latency
    return MOCK_TRIPS.filter(
      (t) =>
        t.from.city.toLowerCase().includes(params.from.toLowerCase()) ||
        t.from.name.toLowerCase().includes(params.from.toLowerCase()),
    );
  }
}

// ─── Profile Types ────────────────────────────────────────────────────────────

export interface UserPreferences {
  smsNotifications: boolean;
  emailNotifications: boolean;
  language: "en" | "fr" | "rw";
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UpdateProfilePayload {
  name?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

// ─── Auth token (set after login) ────────────────────────────────────────────

let _token: string | null = null;
export function setAuthToken(token: string) {
  _token = token;
}
export function getAuthToken() {
  return _token;
}

function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
  };
}

// ─── Mock profile ─────────────────────────────────────────────────────────────

const MOCK_PROFILE: UserProfile = {
  id: "u-001",
  name: "Jane Doe",
  phone: "+254 712 345 678",
  email: "jane@example.com",
  avatar: undefined,
  preferences: {
    smsNotifications: true,
    emailNotifications: false,
    language: "en",
  },
};

// ─── Profile API Functions ────────────────────────────────────────────────────

export async function fetchProfile(): Promise<UserProfile> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/users/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch {
    await new Promise((r) => setTimeout(r, 600));
    return { ...MOCK_PROFILE };
  }
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/users/me`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    Object.assign(MOCK_PROFILE, payload);
    if (payload.preferences) {
      MOCK_PROFILE.preferences = {
        ...MOCK_PROFILE.preferences,
        ...payload.preferences,
      };
    }
    return { ...MOCK_PROFILE };
  }
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/users/me/password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`${res.status}`);
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    // Simulate wrong current password
    if (payload.current_password !== "password123") {
      throw new Error("Current password is incorrect");
    }
  }
}
