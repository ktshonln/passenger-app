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

export interface TripSearchParams {
  from: string;
  to: string;
  date: string;
  operator?: string;
}

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

// ─── Auth token ───────────────────────────────────────────────────────────────

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

// ─── Audit Log ────────────────────────────────────────────────────────────────

function logAudit(
  action: string,
  resource: string,
  meta: Record<string, unknown>,
) {
  const entry = { action, resource, meta, timestamp: new Date().toISOString() };
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
  const res = await fetch(
    `${BASE_URL}/api/v1/locations?q=${encodeURIComponent(query)}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error(`fetchLocations failed: ${res.status}`);
  return res.json();
}

export async function fetchTrips(params: TripSearchParams): Promise<Trip[]> {
  logAudit("SEARCH", "TRIP", { query_params: params });
  const qs = new URLSearchParams({
    from: params.from,
    to: params.to,
    date: params.date,
    ...(params.operator ? { operator: params.operator } : {}),
  });
  const res = await fetch(`${BASE_URL}/api/v1/trips?${qs}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchTrips failed: ${res.status}`);
  return res.json();
}

export async function createBooking(
  trip: Trip,
  passenger: PassengerDetails,
): Promise<Booking> {
  const res = await fetch(`${BASE_URL}/api/v1/bookings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ tripId: trip.id, passenger }),
  });
  if (!res.ok) throw new Error(`createBooking failed: ${res.status}`);
  return res.json();
}

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/api/v1/users/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchProfile failed: ${res.status}`);
  return res.json();
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/api/v1/users/me`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateProfile failed: ${res.status}`);
  return res.json();
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/users/me/password`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`changePassword failed: ${res.status}`);
}
