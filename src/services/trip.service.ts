/**
 * Trip Service - API calls for trip details, pricing, and ticket booking
 */

import { API_BASE_URL, USE_MOCK_DATA } from "@/lib/config";
import { getMockPrice, MOCK_TRIP_DETAILS, mockDelay } from "./mock.data";

export interface TripStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
}

export interface RouteStop {
  order: number;
  stop: TripStop;
}

export interface TripRoute {
  id: string;
  org_id: string | null;
  name: string;
  is_active: boolean;
  route_stops: RouteStop[];
}

export interface TripCompany {
  id: string;
  name: string;
  logo_path?: string;
  story?: string;
}

export interface TripBus {
  id: string;
  org_id: string;
  plate: string;
  type: string;
  total_seats: number;
  is_active: boolean;
}

export interface TripSeries {
  id: string;
  repeat_daily: boolean;
  frequency_minutes?: number;
  starts_on: string;
  ends_on?: string;
}

export interface TripDetail {
  id: string;
  series_id: string;
  route_id: string;
  org_id: string;
  bus_id: string;
  driver_id: string;
  departure_at: string;
  available_seats: number;
  total_seats: number;
  status: "scheduled" | "active" | "completed" | "cancelled";
  is_express: boolean;
  cancellation_allowed: boolean;
  route: TripRoute;
  bus: TripBus;
  series?: TripSeries;
  currency: string; // Not in provided snippet but likely present/needed
  company?: TripCompany; // To maintain compatibility with existing UI if possible
}

export interface PriceResponse {
  boarding_stop_id: string;
  alighting_stop_id: string;
  amount: number;
  currency: string;
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
  id: string;
  status:
    | "initiated"
    | "payment_pending"
    | "confirmed"
    | "failed"
    | "expired"
    | "cancelled";
  amount?: number;
  currency?: string;
  seats_count?: number;
  payment_method?: string;
  boarding_stop?: { id: string; name: string };
  alighting_stop?: { id: string; name: string };
  ticket_id?: string;
}

export interface PaymentStatus {
  status:
    | "confirmed"
    | "failed"
    | "expired"
    | "timeout"
    | "cancelled"
    | "payment_pending";
  ticket?: any;
  reason?: string;
  message?: string;
  retryable?: boolean;
}

/**
 * Fetch trip details by ID
 */
export async function getTripDetail(
  tripId: string,
  locale?: string,
): Promise<TripDetail> {
  if (USE_MOCK_DATA) {
    await mockDelay(600);
    const mockTrip = MOCK_TRIP_DETAILS[tripId];
    if (!mockTrip) {
      throw new Error("Trip not found");
    }

    // Clone and localize mock data if needed
    const trip = JSON.parse(JSON.stringify(mockTrip)) as TripDetail;

    if (locale === "rw") {
      if (trip.company?.id === "c1") {
        trip.company.story =
          "Serivisi nziza cyane yo gutwara abantu mu Rwanda hose ifite intebe nziza n'abashoferi b'ababizobereye";
      } else if (trip.company?.id === "c2") {
        trip.company.story =
          "Ingendo nziza ugana mu majyaruguru ku biciro bijyanye n'ubushobozi kandi wizewe";
      } else if (trip.company?.id === "c3") {
        trip.company.story =
          "Inzira nyinshi mu karere ka Kigali zifite serivisi za express n'izisanzwe";
      } else if (trip.company?.id === "c4") {
        trip.company.story =
          "Ingendo mu gihugu hose ku biciro byiza n'amasaha ahinduka";
      }

      if (trip.route) {
        trip.route.name = trip.route.name
          .replace(" – ", " – ")
          .replace("Express", "Express")
          .replace("Regular", "Isanzwe");
      }
    } else if (locale === "fr") {
      if (trip.company?.id === "c1") {
        trip.company.story =
          "Service express premium à travers le Rwanda avec des sièges confortables et des chauffeurs professionnels";
      } else if (trip.company?.id === "c2") {
        trip.company.story =
          "Trajets confortables vers le nord avec des prix abordables et un service fiable";
      } else if (trip.company?.id === "c3") {
        trip.company.story =
          "La plupart des itinéraires dans la région de Kigali avec des services express et standards";
      } else if (trip.company?.id === "c4") {
        trip.company.story =
          "Couverture nationale avec des prix abordables et des horaires flexibles";
      }

      if (trip.route) {
        trip.route.name = trip.route.name
          .replace(" – ", " – ")
          .replace("Regular", "Standard");
      }
    }

    return trip;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (locale) {
    headers["X-User-Locale"] = locale;
  }

  const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch trip details");
  }

  const data = await response.json();
  return data.trip;
}

/**
 * Get price for specific boarding and alighting stops
 */
export async function getPrice(
  boardingStopId: string,
  alightingStopId: string,
): Promise<PriceResponse> {
  if (USE_MOCK_DATA) {
    await mockDelay(400);
    const mockPrice = getMockPrice(boardingStopId, alightingStopId);
    if (!mockPrice) {
      throw new Error("PRICE_NOT_FOUND");
    }
    return mockPrice as PriceResponse;
  }

  const params = new URLSearchParams({
    boarding_stop_id: boardingStopId,
    alighting_stop_id: alightingStopId,
  });

  const response = await fetch(`${API_BASE_URL}/prices?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      const error = await response.json();
      throw new Error(error.error?.code || "PRICE_NOT_FOUND");
    }
    throw new Error("Failed to fetch price");
  }

  return response.json();
}

/**
 * Book a ticket
 */
export async function bookTicket(
  request: TicketRequest,
  token?: string,
): Promise<TicketResponse> {
  if (USE_MOCK_DATA) {
    await mockDelay(1000);

    // Mock wallet payment - immediate confirmation in mock, but should be payment_pending in reality
    if (request.payment_method === "wallet") {
      return {
        id: `ticket-${Date.now()}`,
        status: "confirmed",
        amount: 3500 * request.seats_count,
        currency: "RWF",
        seats_count: request.seats_count,
        payment_method: "wallet",
        boarding_stop: { id: request.boarding_stop_id, name: "Kigali" },
        alighting_stop: { id: request.alighting_stop_id, name: "Musanze" },
      };
    }

    // Mock MoMo/Cash payment - SSE flow
    return {
      id: `ticket-${Date.now()}`,
      status: "payment_pending",
      ticket_id: `ticket-${Date.now()}`,
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Handle Cash payment specifically as per requirement: POST /tickets/cash
  const url =
    request.payment_method === "cash"
      ? `${API_BASE_URL}/tickets/cash`
      : `${API_BASE_URL}/tickets`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    const error = await response.json();
    throw new Error(
      error.error?.code || error.message || "Failed to book ticket",
    );
  }

  return response.json();
}

/**
 * Create SSE connection for payment status
 */
export function createPaymentSSE(
  ticketId: string,
  onMessage: (data: PaymentStatus) => void,
  onError: (error: Error) => void,
): EventSource | { close: () => void } {
  if (USE_MOCK_DATA) {
    // Mock SSE - simulate payment confirmation after 3 seconds
    const timeout = setTimeout(() => {
      onMessage({
        status: "confirmed",
        ticket: {
          id: ticketId,
          amount: 3500,
          currency: "RWF",
          seats_count: 1,
          payment_method: "mtn",
          boarding_stop: { id: "s1", name: "Kigali" },
          alighting_stop: { id: "s3", name: "Musanze" },
          departure_at: "2026-04-06T06:00:00Z",
          company: { name: "Volcano Express", logo_path: "🌋" },
          bus: { plate: "RAA 001 A" },
          passenger_name: "Demo User",
          passenger_phone: "+250788***456",
        },
      });
    }, 3000);

    return {
      close: () => clearTimeout(timeout),
    };
  }

  // The requirement says: Open GET /tickets/{id}/stream immediately after booking.
  // The stream emits a single data: event and closes.
  const eventSource = new EventSource(
    `${API_BASE_URL}/tickets/${ticketId}/stream`,
  );

  eventSource.onmessage = (event) => {
    try {
      const data: PaymentStatus = JSON.parse(event.data);
      onMessage(data);
      // Auto-close after receiving the event as per requirement
      eventSource.close();
    } catch (e) {
      onError(new Error("Failed to parse SSE data"));
      eventSource.close();
    }
  };

  eventSource.onerror = (event) => {
    onError(new Error("SSE connection failed"));
    eventSource.close();
  };

  return eventSource;
}
