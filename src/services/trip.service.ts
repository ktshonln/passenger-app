/**
 * Trip Service - API calls for trip details, pricing, and ticket booking
 */

import { API_BASE_URL } from "@/lib/config";
import EventSource from "react-native-sse";
import { authFetch, parseErrorResponse } from "./auth.service";

// Interfaces from OpenAPI spec

export interface Location {
  id: string;
  name: string;
  province?: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

export interface RouteListItem {
  id: string;
  name: string;
  status: "active" | "inactive";
  stops_count: number;
  origin: { id: string; name: string };
  destination: { id: string; name: string };
  created_at: string;
}

export interface OrgPublicListItem {
  id: string;
  name: string;
  slug: string;
  org_type: "company" | "cooperative" | "coop_member";
  logo_path?: string | null;
}

export interface TripSearchResult {
  id: string;
  route: { id: string; name: string };
  org: OrgPublicListItem;
  departure_at: string;
  origin: Location;
  destination: Location;
  available_seats: number;
  total_seats: number;
  price: { amount: number; currency: string };
  is_express: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketRequest {
  trip_id: string;
  boarding_stop_id: string;
  alighting_stop_id: string;
  seats_count: number;
  payment_method: "wallet" | "mtn" | "airtel" | "cash";
  phone?: string;
  passenger_name?: string;
}

export interface TicketResponse {
  ticket_id: string;
}

export interface PaymentStatus {
  status:
    | "confirmed"
    | "failed"
    | "expired"
    | "timeout"
    | "cancelled"
    | "payment_pending"
    | "pending";
  ticket?: any;
  reason?: string;
  message?: string;
  retryable?: boolean;
}

export interface PriceResponse {
  boarding_stop_id: string;
  alighting_stop_id: string;
  amount: number;
  currency: string;
}

export interface TripDetail {
  id: string;
  route: RouteListItem;
  org: OrgPublicListItem;
  departure_at: string;
  available_seats: number;
  total_seats: number;
  price: PriceResponse;
  is_express: boolean;
  bus?: { id: string; plate: string; type: string };
  stops: Location[];
}

/**
 * Fetch all locations (bus stops)
 */
export async function getLocations(
  q?: string,
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<Location>> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const response = await authFetch(`${API_BASE_URL}/locations?${params}`);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

/**
 * Fetch all active routes
 */
export async function getRoutes(
  q?: string,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<RouteListItem>> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const response = await authFetch(`${API_BASE_URL}/routes?${params}`);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

/**
 * Fetch public active organizations (companies)
 */
export async function getOrganizations(
  q?: string,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<OrgPublicListItem>> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const response = await authFetch(
    `${API_BASE_URL}/organizations/public?${params}`,
  );

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

/**
 * Search trips with filters
 */
export async function searchTrips(params?: {
  q?: string;
  origin_id?: string;
  company_id?: string;
  date?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<TripSearchResult>> {
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set("q", params.q);
  if (params?.origin_id) searchParams.set("origin_id", params.origin_id);
  if (params?.company_id) searchParams.set("company_id", params.company_id);
  if (params?.date) searchParams.set("date", params.date);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const response = await authFetch(`${API_BASE_URL}/trips?${searchParams}`);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

/**
 * Fetch trip details by ID
 */
export async function getTripDetail(
  tripId: string,
  locale?: string,
): Promise<TripDetail> {
  const headers: Record<string, string> = {};
  if (locale) {
    headers["X-User-Locale"] = locale;
  }

  const response = await authFetch(`${API_BASE_URL}/trips/${tripId}`, {
    headers,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

/**
 * Get price for specific boarding and alighting stops
 */
export async function getPrice(
  boardingStopId: string,
  alightingStopId: string,
): Promise<PriceResponse> {
  const params = new URLSearchParams({
    boarding_stop_id: boardingStopId,
    alighting_stop_id: alightingStopId,
  });

  const response = await authFetch(`${API_BASE_URL}/prices?${params}`);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

/**
 * Book a ticket
 */
export async function bookTicket(
  request: TicketRequest,
  token?: string,
  sudoToken?: string,
): Promise<TicketResponse> {
  const headers: Record<string, string> = {};
  if (sudoToken) {
    headers["x-sudo-token"] = sudoToken;
  }

  const response = await authFetch(
    `${API_BASE_URL}/tickets`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    },
    token,
  );

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

/**
 * Create SSE connection for payment status
 */
export function createPaymentSSE(
  ticketId: string,
  token: string | null,
  onMessage: (data: PaymentStatus) => void,
  onError: (error: Error) => void,
): EventSource {
  // The requirement says: Open GET /tickets/{id}/stream immediately after booking.
  // The stream emits a single data: event and closes.
  let url = `${API_BASE_URL}/tickets/${ticketId}/stream`;
  if (token) {
    url += `?access_token=${encodeURIComponent(token)}`;
  }

  console.log("Creating SSE at:", url);

  const eventSource = new EventSource(url);

  eventSource.addEventListener("message", (event: any) => {
    try {
      console.log("SSE message received:", event.data);
      const data: PaymentStatus = JSON.parse(event.data);
      onMessage(data);
      // Auto-close after receiving the event as per requirement
      if (data.status !== "pending") {
        eventSource.close();
      }
    } catch (e) {
      console.error("Failed to parse SSE data:", e);
      onError(new Error("Failed to parse SSE data"));
      eventSource.close();
    }
  });

  eventSource.addEventListener("error", (error: any) => {
    console.error("SSE Error:", error);
    onError(new Error("SSE connection failed"));
    eventSource.close();
  });

  return eventSource;
}
