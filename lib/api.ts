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
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.katisha.online";

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
  timeFrom?: string; // "HH:mm" e.g. "06:00"
  timeTo?: string; // "HH:mm" e.g. "12:00"
  page?: number; // default 1
  limit?: number; // default 20
}

export interface PopularRoute {
  from: Location;
  to: Location;
  minPrice: number;
  currency: string;
  tripsPerDay: number;
  duration: string;
  stops?: RouteStop[];
}

export interface RouteStop {
  id: string;
  name: string;
  city: string;
  code: string;
  distanceFromOrigin?: string; // e.g. "45 km"
  timeFromOrigin?: string; // e.g. "45 min"
  priceFromOrigin?: number;
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

export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  logo_path: string | null;
  story: string | null;
}

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
  signal?: AbortSignal,
): Promise<LocationSuggestion[]> {
  const res = await fetch(
    `${BASE_URL}/api/v1/locations?q=${encodeURIComponent(query)}`,
    { headers: authHeaders(), signal },
  );
  if (!res.ok) throw new Error(`fetchLocations failed: ${res.status}`);
  const body = await res.json();
  // Handle both plain array and { locations: LocationSuggestion[] } envelope
  return (
    Array.isArray(body) ? body : (body.locations ?? [])
  ) as LocationSuggestion[];
}

// ─── Companies ────────────────────────────────────────────────────────────────

export async function fetchCompanies(): Promise<Company[]> {
  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (process.env.EXPO_PUBLIC_USE_MOCK === "true") {
    const { MOCK_COMPANIES } = require("../src/services/mock.data");
    return MOCK_COMPANIES;
  }

  // ── Real API ───────────────────────────────────────────────────────────────
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

export async function fetchPublicOrganizations(
  query = "",
  page = 1,
  limit = 50,
): Promise<PublicOrganization[]> {
  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (process.env.EXPO_PUBLIC_USE_MOCK === "true") {
    const { MOCK_COMPANIES } = require("../src/services/mock.data");
    return MOCK_COMPANIES.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.shortName,
      org_type: "bus_company",
      logo_path: c.logoUrl,
      story: null,
    }));
  }

  // ── Real API ───────────────────────────────────────────────────────────────
  const qs = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });
  const res = await fetch(`${BASE_URL}/api/v1/organizations/public?${qs}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok)
    throw new Error(`fetchPublicOrganizations failed: ${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body)) {
    console.warn("[fetchPublicOrganizations] unexpected response shape:", body);
    return [];
  }
  // TODO: update mapping once real response shape is confirmed
  return body as PublicOrganization[];
}

// ─── Trips ────────────────────────────────────────────────────────────────────

export async function fetchTrips(params: TripSearchParams): Promise<Trip[]> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (process.env.EXPO_PUBLIC_USE_MOCK === "true") {
    const { MOCK_TRIPS } = require("../src/services/mock.data");
    const start = (page - 1) * limit;
    return MOCK_TRIPS.slice(start, start + limit);
  }

  // ── Real API ───────────────────────────────────────────────────────────────
  logAudit("SEARCH", "TRIP", { query_params: params });
  const qs = new URLSearchParams({
    from: params.from,
    to: params.to,
    date: params.date,
    page: String(page),
    limit: String(limit),
    ...(params.operatorId ? { operator_id: params.operatorId } : {}),
    ...(params.timeFrom ? { time_from: params.timeFrom } : {}),
    ...(params.timeTo ? { time_to: params.timeTo } : {}),
  });
  const res = await fetch(`${BASE_URL}/api/v1/trips?${qs}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchTrips failed: ${res.status}`);

  // Handle both plain array and { data, meta } envelope responses
  const body = await res.json();
  if (Array.isArray(body)) {
    return body as Trip[];
  }
  // Envelope shape: { data: Trip[], meta?: { total: number } }
  return (body.data ?? []) as Trip[];
}

// ─── Popular routes ───────────────────────────────────────────────────────────

export async function fetchPopularRoutes(): Promise<PopularRoute[]> {
  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (process.env.EXPO_PUBLIC_USE_MOCK === "true") {
    const { MOCK_POPULAR_ROUTES } = require("../src/services/mock.data");
    return MOCK_POPULAR_ROUTES;
  }

  // ── Real API ───────────────────────────────────────────────────────────────
  const res = await fetch(`${BASE_URL}/api/v1/routes/popular`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`fetchPopularRoutes failed: ${res.status}`);
  return res.json();
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export async function fetchRecommendations(): Promise<Recommendation[]> {
  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (process.env.EXPO_PUBLIC_USE_MOCK === "true") {
    const { getMockRecommendations } =
      await import("../src/services/mock.data");
    return getMockRecommendations();
  }

  // ── Real API ───────────────────────────────────────────────────────────────
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
