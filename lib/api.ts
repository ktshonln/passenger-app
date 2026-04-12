/**
 * lib/api.ts — single source of truth for all API types and fetch functions.
 *
 * MOCK MODE: set EXPO_PUBLIC_USE_MOCK=true in .env.local
 * REAL API:  set EXPO_PUBLIC_USE_MOCK=false and EXPO_PUBLIC_API_BASE_URL
 *
 * Every function here has a mock branch and a real branch.
 * When the API is ready, delete the mock branches — nothing else changes.
 */

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.katisha.app";

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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Location {
  id: string;
  name: string;
  city: string;
  code: string;
}

/** Extended location returned by autocomplete — includes live trip count */
export interface LocationSuggestion extends Location {
  tripsToday: number;
  popularDestinations: string[];
}

export interface Company {
  id: string;
  name: string;
  shortName: string;
  /** URI to the company logo image. In mock mode this is an emoji placeholder. */
  logoUrl: string;
  /** Brand hex color */
  color: string;
  rating: number;
  totalTripsPerDay: number;
  popular: boolean;
  description?: string;
  phone?: string;
  email?: string;
}

export interface Trip {
  id: string;
  from: Location;
  to: Location;
  departureTime: string; // ISO 8601
  arrivalTime: string; // ISO 8601
  duration: string; // human-readable e.g. "2h 30m"
  operator: string; // company name — join on Company.name
  operatorId: string; // company id — use for filtering
  price: number;
  currency: string;
  seatsAvailable: number;
  busType: string;
}

export interface TripSearchParams {
  from: string;
  to: string;
  date: string;
  operatorId?: string;
}

export interface PopularRoute {
  from: Location;
  to: Location;
  minPrice: number;
  currency: string;
  tripsPerDay: number;
  duration: string;
}

export interface Recommendation {
  trip: Trip;
  reason: "past_route" | "popular" | "nearby";
  reasonLabel: string; // already translated by server, or use i18n key
}

export interface SearchHistoryItem {
  id: string;
  from: Location;
  to: Location;
  date: string;
  searchedAt: string;
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
  paymentMethod?: PaymentMethod;
}

export type PaymentMethod = "momo" | "airtel" | "card";

export interface PaymentPayload {
  bookingId: string;
  method: PaymentMethod;
  /** Phone number for MoMo / Airtel */
  phoneNumber?: string;
  /** Card details — never stored, passed directly to payment gateway */
  card?: {
    number: string;
    expiry: string;
    cvv: string;
    holder: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
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

// ─── Audit log (fire-and-forget) ─────────────────────────────────────────────

function logAudit(
  action: string,
  resource: string,
  meta: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "test") return; // no-op in Jest
  const entry = { action, resource, meta, timestamp: new Date().toISOString() };
  fetch(`${BASE_URL}/api/v1/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  }).catch(() => {
    if (__DEV__) console.log("[AUDIT]", JSON.stringify(entry));
  });
}

// ─── Locations ────────────────────────────────────────────────────────────────

export async function fetchLocations(
  query: string,
): Promise<LocationSuggestion[]> {
  const res = await fetch(
    `${BASE_URL}/api/v1/locations?q=${encodeURIComponent(query)}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error(`fetchLocations failed: ${res.status}`);
  return res.json();
}

// ─── Companies ────────────────────────────────────────────────────────────────

export async function fetchCompanies(): Promise<Company[]> {
  const res = await fetch(`${BASE_URL}/api/v1/companies`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchCompanies failed: ${res.status}`);
  return res.json();
}

export async function fetchCompany(id: string): Promise<Company> {
  const res = await fetch(`${BASE_URL}/api/v1/companies/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchCompany failed: ${res.status}`);
  return res.json();
}

// ─── Trips ────────────────────────────────────────────────────────────────────

export async function fetchTrips(params: TripSearchParams): Promise<Trip[]> {
  logAudit("SEARCH", "TRIP", { query_params: params });
  const qs = new URLSearchParams({
    from: params.from,
    to: params.to,
    date: params.date,
    ...(params.operatorId ? { operator_id: params.operatorId } : {}),
  });
  const res = await fetch(`${BASE_URL}/api/v1/trips?${qs}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchTrips failed: ${res.status}`);
  return res.json();
}

// ─── Popular routes ───────────────────────────────────────────────────────────

export async function fetchPopularRoutes(): Promise<PopularRoute[]> {
  const res = await fetch(`${BASE_URL}/api/v1/routes/popular`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchPopularRoutes failed: ${res.status}`);
  return res.json();
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export async function fetchRecommendations(): Promise<Recommendation[]> {
  const res = await fetch(`${BASE_URL}/api/v1/recommendations`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchRecommendations failed: ${res.status}`);
  return res.json();
}

// ─── Search history ───────────────────────────────────────────────────────────

export async function fetchSearchHistory(): Promise<SearchHistoryItem[]> {
  const res = await fetch(`${BASE_URL}/api/v1/search-history`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchSearchHistory failed: ${res.status}`);
  return res.json();
}

export async function saveSearchHistory(
  item: Omit<SearchHistoryItem, "id" | "searchedAt">,
): Promise<SearchHistoryItem> {
  const res = await fetch(`${BASE_URL}/api/v1/search-history`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`saveSearchHistory failed: ${res.status}`);
  return res.json();
}

export async function deleteSearchHistoryItem(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/search-history/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`deleteSearchHistoryItem failed: ${res.status}`);
}

export async function clearSearchHistory(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/search-history`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`clearSearchHistory failed: ${res.status}`);
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function fetchBookings(): Promise<Booking[]> {
  const res = await fetch(`${BASE_URL}/api/v1/bookings`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchBookings failed: ${res.status}`);
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

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function initiatePayment(
  payload: PaymentPayload,
): Promise<PaymentResult> {
  const res = await fetch(`${BASE_URL}/api/v1/payments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`initiatePayment failed: ${res.status}`);
  return res.json();
}

// ─── Profile ──────────────────────────────────────────────────────────────────

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
