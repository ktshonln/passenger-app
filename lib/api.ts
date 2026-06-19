/**
 * lib/api.ts — single source of truth for all API types and fetch functions.
 */

import EventSource from "react-native-sse";
import { authFetch, parseErrorResponse } from "../src/services/auth.service";
import { API_BASE_URL, TELEMETRY_URL } from "./config";

// ─── Auth token ───────────────────────────────────────────────────────────────

let _token: string | null = null;
export function setAuthToken(token: string) {
  _token = token;
}
export function getAuthToken() {
  return _token;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Location {
  id: string;
  name: string;
  city: string | null;
  lat: number;
  lng: number;
  province: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SearchHistoryItem {
  id: string;
  from: Location;
  to: Location;
  date: string;
  searchedAt: string;
}

export interface Recommendation {
  id: string;
  origin: Location;
  destination: Location;
  price: number;
  currency: string;
  tripsPerDay: number;
}

export interface PassengerDetails {
  fullName: string;
  phone: string;
  email?: string;
}

export interface PaymentPayload {
  amount: number;
  currency: string;
  paymentMethod: "wallet" | "mtn" | "airtel" | "cash";
  phone?: string;
  password?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  avatar?: string | null;
  preferences: {
    smsNotifications: boolean;
    emailNotifications: boolean;
    language: string;
  };
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  avatar_path?: string | null;
  notif_channel?: ("sms" | "email" | "app")[];
  locale?: "rw" | "en" | "fr";
  two_factor_enabled?: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Extended location returned by autocomplete — includes live trip count */
export interface LocationSuggestion extends Location {
  tripsToday?: number;
  popularDestinations?: string[];
}

export interface Company {
  id: string;
  name: string;
  logo_path: string | null;
  logoUrl?: string;
  story?: string | null;
  rating?: number;
  shortName?: string;
  color?: string;
  totalTripsPerDay?: number;
  popular?: boolean;
}

export interface TripBus {
  id: string;
  plate: string;
  type: string;
}

export interface Trip {
  id: string;
  origin: Location;
  destination: Location;
  departure_at: string; // ISO 8601
  arrival_at: string | null; // ISO 8601
  price: number | null;
  currency: string;
  available_seats: number;
  total_seats: number;
  company: Company;
  bus: TripBus | null;
}

export interface TripSearchParams {
  q?: string;
  origin_id?: string;
  company_id?: string;
  date?: string;
  page?: number; // default 1
  limit?: number; // default 20
}

export interface PaginatedTripSearch {
  data: Trip[];
  total: number;
  page: number;
  limit: number;
}

export interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

export interface TripDetail {
  id: string;
  series_id: string;
  route_id: string;
  org_id: string;
  bus_id: string | null;
  driver_id: string | null;
  departure_at: string;
  available_seats: number;
  total_seats: number;
  status: "scheduled" | "active" | "completed" | "cancelled";
  is_express: boolean;
  cancellation_allowed: boolean;
  currency: string;
  origin: Location;
  destination: Location;
  company?: Company;
  stops: RouteStop[];
  created_at: string;
  updated_at: string;
}

export interface PriceResponse {
  boarding_stop_id: string;
  alighting_stop_id: string;
  amount: number;
  currency: string;
}

export interface PublicOrganization {
  id: string;
  name: string;
  logo_path?: string | null;
  logoUrl?: string | null;
  story?: string | null;
  rating?: number;
  totalTripsPerDay?: number;
}

export interface PopularRouteStop {
  id: string;
  name: string;
  city?: string;
  lat: number;
  lng: number;
  order: number;
  code?: string;
}

export interface PopularRoute {
  id?: string;
  from: PopularRouteStop;
  to: PopularRouteStop;
  minPrice: number;
  currency: string;
  tripsPerDay: number;
  duration: string;
  stops?: PopularRouteStop[];
  sampleTrip?: Trip;
}

// --- Booking types ---
export interface BookingPassenger {
  fullName: string;
  phone?: string;
  email?: string;
}

export interface BookingTrip {
  id: string;
  from: {
    id: string;
    name: string;
    city?: string;
    code?: string;
    lat?: number;
    lng?: number;
  };
  to: {
    id: string;
    name: string;
    city?: string;
    code?: string;
    lat?: number;
    lng?: number;
  };
  departureTime: string;
  arrivalTime?: string;
  duration?: string;
  operator?: string;
  operatorId?: string;
  price?: number;
  currency?: string;
  seatsAvailable?: number;
  busType?: string;
  bus?: { id: string; plate: string; type: string } | null;
}

export interface Booking {
  id: string;
  bookingRef: string;
  status: "confirmed" | "pending" | "cancelled" | "failed" | "expired";
  trip: BookingTrip;
  passenger: BookingPassenger;
  seatNumber: string;
  totalPaid: number;
  currency: string;
  bookedAt: string;
  issuedBy?: string;
}

// ─── Audit log (fire-and-forget) ─────────────────────────────────────────────

function logAudit(
  action: string,
  resource: string,
  meta: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "test") return; // no-op in Jest
  const entry = { action, resource, meta, timestamp: new Date().toISOString() };
  fetch(`${API_BASE_URL}/audit`, {
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
): Promise<Location[]> {
  const qs = new URLSearchParams({
    q: query,
  });
  const res = await authFetch(`${API_BASE_URL}/locations?${qs}`, { signal });
  if (!res.ok) throw await parseErrorResponse(res);
  const body = await res.json();
  // Handle both plain array and { data: Location[] } envelope
  return (Array.isArray(body) ? body : (body.data ?? [])) as Location[];
}

// ─── Companies ────────────────────────────────────────────────────────────────

export async function fetchCompanies(): Promise<Company[]> {
  const res = await authFetch(`${API_BASE_URL}/companies`);
  if (!res.ok) throw await parseErrorResponse(res);
  const body = await res.json();
  const data = Array.isArray(body) ? body : (body.data ?? []);
  return data.map((org: any) => ({
    id: org.id,
    name: org.name,
    shortName: org.name,
    logo_path: org.logo_path ?? null,
    logoUrl: org.logo_path ?? "",
    story: org.story,
    color: "#0A4370",
    rating: org.rating ?? 4.5,
    totalTripsPerDay: 10,
    popular: true,
  }));
}

export async function fetchCompany(id: string): Promise<Company> {
  const res = await authFetch(`${API_BASE_URL}/companies/${id}`);
  if (!res.ok) throw await parseErrorResponse(res);
  const org = await res.json();
  return {
    id: org.id,
    name: org.name,
    shortName: org.name,
    logo_path: org.logo_path ?? null,
    logoUrl: org.logo_path ?? "",
    story: org.story,
    color: "#0A4370",
    rating: org.rating ?? 4.5,
    totalTripsPerDay: 10,
    popular: true,
  };
}

export async function fetchPublicOrganizations(
  query = "",
  page = 1,
  limit = 50,
): Promise<PublicOrganization[]> {
  const qs = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });
  const res = await authFetch(`${API_BASE_URL}/organizations/public?${qs}`);
  if (!res.ok) throw await parseErrorResponse(res);
  const body = await res.json();
  if (body && body.data && Array.isArray(body.data)) {
    return body.data.map((org: any) => ({
      id: org.id,
      name: org.name,
      logo_path: org.logo_path,
      logoUrl: org.logo_path,
      story: org.story,
      rating: 4.5, // default rating since it might not be in the API
      totalTripsPerDay: 5, // default value
    }));
  }
  if (Array.isArray(body)) {
    return body.map((org: any) => ({
      ...org,
      logoUrl: org.logo_path,
      totalTripsPerDay: 5,
    }));
  }
  console.warn("[fetchPublicOrganizations] unexpected response shape:", body);
  return [];
}

// ─── Trips ────────────────────────────────────────────────────────────────────

export async function fetchTrips(
  params: TripSearchParams,
): Promise<PaginatedTripSearch> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  logAudit("SEARCH", "TRIP", { query_params: params });
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(params.q ? { q: params.q } : {}),
    ...(params.origin_id ? { origin_id: params.origin_id } : {}),
    ...(params.company_id ? { company_id: params.company_id } : {}),
    ...(params.date ? { date: params.date } : {}),
  });
  const res = await authFetch(`${API_BASE_URL}/trips?${qs}`);
  if (!res.ok) throw await parseErrorResponse(res);

  const body = await res.json();
  return body;
}

// ─── Popular routes ───────────────────────────────────────────────────────────

export async function fetchPopularRoutes(): Promise<PopularRoute[]> {
  const qs = new URLSearchParams({
    limit: "10",
  });
  const res = await authFetch(`${API_BASE_URL}/routes?${qs}`);
  if (!res.ok) throw await parseErrorResponse(res);
  const body = await res.json();

  // Map from route API response to PopularRoute
  const routes = (body.data || body) as any[];
  return routes.map((route) => {
    const origin = route.origin;
    const destination = route.destination;

    const fromCity = origin?.province || origin?.name || "";
    const toCity = destination?.province || destination?.name || "";

    return {
      id: route.id,
      from: {
        id: origin?.id || "",
        name: origin?.name || "",
        city: fromCity,
        lat: origin?.lat || 0,
        lng: origin?.lng || 0,
        code: fromCity.substring(0, 3).toUpperCase() || "",
        order: 0,
      },
      to: {
        id: destination?.id || "",
        name: destination?.name || "",
        city: toCity,
        lat: destination?.lat || 0,
        lng: destination?.lng || 0,
        code: toCity.substring(0, 3).toUpperCase() || "",
        order: 1,
      },
      minPrice: 3000, // default since price not in route list
      currency: "RWF",
      tripsPerDay: route.stops_count || 5,
      duration: "2h 30m",
      stops: [],
    };
  });
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export async function fetchRecommendations(): Promise<Recommendation[]> {
  const res = await authFetch(`${API_BASE_URL}/recommendations`);
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

// ─── Search history ───────────────────────────────────────────────────────────

export async function fetchSearchHistory(): Promise<SearchHistoryItem[]> {
  const res = await authFetch(`${API_BASE_URL}/search-history`);
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

export async function saveSearchHistory(
  item: Omit<SearchHistoryItem, "id" | "searchedAt">,
): Promise<SearchHistoryItem> {
  const res = await authFetch(`${API_BASE_URL}/search-history`, {
    method: "POST",
    body: JSON.stringify(item),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

export async function deleteSearchHistoryItem(id: string): Promise<void> {
  const res = await authFetch(`${API_BASE_URL}/search-history/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw await parseErrorResponse(res);
}

export async function clearSearchHistory(): Promise<void> {
  const res = await authFetch(`${API_BASE_URL}/search-history`, {
    method: "DELETE",
  });
  if (!res.ok) throw await parseErrorResponse(res);
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface PaginatedTickets {
  tickets: any[];
  total: number;
  page: number;
  limit: number;
}

// Map Ticket schema to our Booking interface
function mapTicketToBooking(ticket: any): Booking {
  console.log("Mapping ticket to booking:", ticket);

  // Create a booking ref
  const bookingRef = `KAT-${ticket.id.slice(-4).toUpperCase()}`;

  // Determine status
  let status: Booking["status"] = "pending";
  if (ticket.status === "confirmed") status = "confirmed";
  else if (ticket.status === "cancelled") status = "cancelled";
  else if (ticket.status === "failed" || ticket.status === "expired")
    status = "cancelled";

  // Format duration
  let durationText = "2h 30m";
  if (ticket.trip?.duration_minutes) {
    const hours = Math.floor(ticket.trip.duration_minutes / 60);
    const minutes = ticket.trip.duration_minutes % 60;
    durationText = `${hours}h ${minutes}m`;
  }

  // Get passenger name from user or ticket
  let passengerName = ticket.passenger_name || "Passenger";
  // If passenger_name is UUID, try to get from somewhere else
  if (
    passengerName &&
    passengerName.includes("-") &&
    passengerName.length === 36
  ) {
    passengerName = "Passenger";
  }

  return {
    id: ticket.id,
    bookingRef,
    status,
    trip: {
      id: ticket.trip_id,
      from: {
        id: ticket.boarding_stop?.id,
        name: ticket.boarding_stop?.name || "",
        city:
          ticket.boarding_stop?.city || ticket.boarding_stop?.province || "",
        code: (
          ticket.boarding_stop?.city ||
          ticket.boarding_stop?.province ||
          ""
        )
          .slice(0, 3)
          .toUpperCase(),
        lat: ticket.boarding_stop?.lat || 0,
        lng: ticket.boarding_stop?.lng || 0,
      },
      to: {
        id: ticket.alighting_stop?.id,
        name: ticket.alighting_stop?.name || "",
        city:
          ticket.alighting_stop?.city || ticket.alighting_stop?.province || "",
        code: (
          ticket.alighting_stop?.city ||
          ticket.alighting_stop?.province ||
          ""
        )
          .slice(0, 3)
          .toUpperCase(),
        lat: ticket.alighting_stop?.lat || 0,
        lng: ticket.alighting_stop?.lng || 0,
      },
      departureTime:
        ticket.trip?.departure_at ||
        ticket.confirmed_at ||
        ticket.created_at ||
        new Date().toISOString(),
      arrivalTime:
        ticket.trip?.arrival_at ||
        ticket.confirmed_at ||
        ticket.created_at ||
        new Date().toISOString(),
      duration: durationText,
      operator: ticket.org?.name || ticket.organization?.name || "Unknown",
      operatorId: ticket.org_id,
      price: ticket.ticket_price || 0,
      currency: "RWF",
      busType: ticket.trip?.bus?.type || "Unknown",
      bus: ticket.trip?.bus || null,
    },
    passenger: {
      fullName: passengerName,
      phone: ticket.passenger_phone || "",
      email: ticket.passenger_email || "",
    },
    seatNumber: ticket.seats_count?.toString() || "1",
    totalPaid: ticket.ticket_price || 0,
    currency: "RWF",
    bookedAt:
      ticket.confirmed_at || ticket.created_at || new Date().toISOString(),
  };
}

export async function fetchBookings(): Promise<Booking[]> {
  console.log("fetchBookings: calling /tickets/me");
  const res = await authFetch(`${API_BASE_URL}/tickets/me`);
  if (!res.ok) throw await parseErrorResponse(res);
  const rawData = await res.json();
  console.log("fetchBookings raw API response:", rawData);

  // Handle different response formats
  let tickets: any[] = [];
  if (Array.isArray(rawData)) {
    tickets = rawData;
  } else if (rawData && Array.isArray(rawData.tickets)) {
    tickets = rawData.tickets;
  } else if (rawData && Array.isArray(rawData.data)) {
    tickets = rawData.data;
  }

  console.log("fetchBookings tickets to map:", tickets);
  const bookings = tickets.map(mapTicketToBooking);
  console.log("fetchBookings final bookings:", bookings);
  return bookings;
}

export async function createBooking(
  trip: Trip,
  passenger: PassengerDetails,
): Promise<Booking> {
  const res = await authFetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    body: JSON.stringify({ tripId: trip.id, passenger }),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function initiatePayment(
  payload: PaymentPayload,
): Promise<PaymentResult> {
  const res = await authFetch(`${API_BASE_URL}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<UserProfile> {
  const res = await authFetch(`${API_BASE_URL}/users/me`);
  if (!res.ok) throw await parseErrorResponse(res);
  const profile = await res.json();
  // For backward compatibility with old format:
  return {
    ...profile,
    name: profile.name || `${profile.first_name} ${profile.last_name}`,
    phone: profile.phone || profile.phone_number,
    avatar: profile.avatar || profile.avatar_path,
    preferences: profile.preferences || {
      smsNotifications: (profile.notif_channel || ["sms"]).includes("sms"),
      emailNotifications: (profile.notif_channel || ["email"]).includes(
        "email",
      ),
      language: profile.locale || profile.preferences?.language || "rw",
    },
  } as UserProfile;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const res = await authFetch(`${API_BASE_URL}/users/me`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  const profile = await res.json();
  return {
    ...profile,
    name: profile.name || `${profile.first_name} ${profile.last_name}`,
    phone: profile.phone || profile.phone_number,
    avatar: profile.avatar || profile.avatar_path,
    preferences: profile.preferences || {
      smsNotifications: (profile.notif_channel || ["sms"]).includes("sms"),
      emailNotifications: (profile.notif_channel || ["email"]).includes(
        "email",
      ),
      language: profile.locale || profile.preferences?.language || "rw",
    },
  } as UserProfile;
}

// Note: For now, keep changePassword as is for backward compatibility with tests
export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  const res = await authFetch(`${API_BASE_URL}/users/me/password`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseErrorResponse(res);
}

// ─── Bus Types ───────────────────────────────────────────────────────────────────

export interface BusDriver {
  id: string;
  first_name: string;
  last_name: string;
  avatar_path: string | null;
}

export interface BusRoute {
  id: string;
  name: string;
}

export interface BusOrg {
  id: string;
  name: string;
}

export interface BusListItem {
  id: string;
  plate: string;
  type: string;
  device_id: string | null;
  capacity: number;
  status: "active" | "inactive";
  driver: BusDriver | null;
  org: BusOrg;
  created_at: string;
}

export interface BusDetail extends BusListItem {
  routes: BusRoute[];
  updated_at: string;
}

export interface BusTrip {
  id: string;
  departure_at: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  route: { id: string; name: string };
  booked_seats: number;
  total_seats: number;
  remaining_seats: number;
}

export interface PaginatedBuses {
  data: BusListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedBusTrips {
  data: BusTrip[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateBusPayload {
  plate: string;
  type: string;
  capacity: number;
  device_id?: string | null;
  driver_id?: string | null;
  route_ids?: string[];
  org_id?: string;
}

export interface UpdateBusPayload {
  plate?: string;
  type?: string;
  capacity?: number;
  device_id?: string | null;
  status?: "active" | "inactive";
  driver_id?: string | null;
  route_ids?: string[];
}

export interface TelemetryFix {
  lat: number;
  lon: number;
  ts: string;
}

// ─── Bus Functions ───────────────────────────────────────────────────────────────

export async function listBuses(params?: {
  q?: string;
  status?: "active" | "inactive";
  driver_id?: string;
  org_id?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedBuses> {
  const qs = new URLSearchParams();
  if (params?.q) qs.append("q", params.q);
  if (params?.status) qs.append("status", params.status);
  if (params?.driver_id) qs.append("driver_id", params.driver_id);
  if (params?.org_id) qs.append("org_id", params.org_id);
  if (params?.page) qs.append("page", String(params.page));
  if (params?.limit) qs.append("limit", String(params.limit));

  const res = await authFetch(`${API_BASE_URL}/buses?${qs}`);
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

export async function getBus(id: string): Promise<BusDetail> {
  const res = await authFetch(`${API_BASE_URL}/buses/${id}`);
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

export async function createBus(payload: CreateBusPayload): Promise<BusDetail> {
  const res = await authFetch(`${API_BASE_URL}/buses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

export async function updateBus(
  id: string,
  payload: UpdateBusPayload,
): Promise<BusDetail> {
  const res = await authFetch(`${API_BASE_URL}/buses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

export async function deleteBus(id: string): Promise<void> {
  const res = await authFetch(`${API_BASE_URL}/buses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw await parseErrorResponse(res);
}

export async function listBusTrips(
  id: string,
  params?: { page?: number; limit?: number },
): Promise<PaginatedBusTrips> {
  const qs = new URLSearchParams();
  if (params?.page) qs.append("page", String(params.page));
  if (params?.limit) qs.append("limit", String(params.limit));

  const res = await authFetch(`${API_BASE_URL}/buses/${id}/trips?${qs}`);
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

// ─── Telemetry Functions ─────────────────────────────────────────────────────────

export async function getBusLatestLocation(
  busId: string,
): Promise<TelemetryFix | null> {
  const res = await fetch(`${TELEMETRY_URL}/buses/${busId}/location`);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Failed to get bus location: ${res.status}`);
  return res.json();
}

export function subscribeToBusLocationStream(
  busId: string,
  onLocation: (location: TelemetryFix) => void,
  onError?: (error: Error) => void,
): () => void {
  let eventSource: EventSource | null = null;
  try {
    eventSource = new EventSource(`${TELEMETRY_URL}/buses/${busId}/stream`);

    eventSource.addEventListener("message", (event) => {
      try {
        const location = JSON.parse(event.data as string) as TelemetryFix;
        onLocation(location);
      } catch (e) {
        if (onError) onError(e instanceof Error ? e : new Error(String(e)));
      }
    });

    eventSource.addEventListener("error", (event) => {
      if (onError) onError(new Error("SSE connection error"));
    });
  } catch (e) {
    if (onError) onError(e instanceof Error ? e : new Error(String(e)));
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
}
