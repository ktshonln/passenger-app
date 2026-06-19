/**
 * Wallet Service
 * All wallet operations proxy through the User Service.
 * The frontend never calls the Payment Service directly.
 */

import { API_BASE_URL } from "@/lib/config";
import EventSource from "react-native-sse";
import { authFetch, parseErrorResponse } from "./auth.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletBalance {
  available: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: "topup" | "ticket_payment" | "refund";
  amount: number;
  currency: string;
  description: string;
  created_at: string;
  reference: string | null;
  ticket_id: string | null;
  balance_after: number;
}

export interface WalletTransactionsResponse {
  data: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface TopupRequest {
  amount: number;
  payment_method: "mtn" | "airtel";
  phone?: string;
}

export interface TopupResponse {
  topup_id: string;
}

export interface TopupSSEEvent {
  status: "pending" | "confirmed" | "failed" | "timeout";
  amount?: number;
  currency?: string;
  new_balance?: number;
  message?: string;
  reason?: string;
  retryable?: boolean;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getWalletBalance(token: string): Promise<WalletBalance> {
  console.log(
    "[wallet.service] Fetching wallet balance from:",
    `${API_BASE_URL}/users/me/wallet`,
  );
  const res = await authFetch(`${API_BASE_URL}/users/me/wallet`, {}, token);
  console.log("[wallet.service] Wallet balance response status:", res.status);
  if (!res.ok) throw await parseErrorResponse(res);
  const data = await res.json();
  console.log("[wallet.service] Wallet balance response data:", data);
  return data;
}

export async function getWalletTransactions(
  token: string,
  page = 1,
  limit = 20,
  type?: "topup" | "ticket_payment" | "refund",
): Promise<WalletTransactionsResponse> {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(type ? { type } : {}),
  });
  const res = await authFetch(
    `${API_BASE_URL}/users/me/wallet/transactions?${qs}`,
    {},
    token,
  );
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

export async function initiateTopup(
  token: string,
  req: TopupRequest,
): Promise<TopupResponse> {
  const res = await authFetch(
    `${API_BASE_URL}/users/me/wallet/topup`,
    { method: "POST", body: JSON.stringify(req) },
    token,
  );
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

export function createTopupSSE(
  token: string,
  topupId: string,
  onEvent: (e: TopupSSEEvent) => void,
  onError: (err: Error) => void,
): { close: () => void } {
  const url = `${API_BASE_URL}/users/me/wallet/topup/${topupId}/stream?access_token=${encodeURIComponent(token)}`;
  const es = new EventSource(url);

  const handleEvent = (event: any) => {
    try {
      const data: TopupSSEEvent = JSON.parse(event.data);
      onEvent(data);
      if (data.status !== "pending") es.close();
    } catch {
      onError(new Error("Failed to parse SSE message"));
    }
  };

  // Listen to all messages and check the status from the data
  es.addEventListener("message", handleEvent);
  // Also listen for specific event types as fallback with type assertion
  (es.addEventListener as any)("pending", handleEvent);
  (es.addEventListener as any)("confirmed", handleEvent);
  (es.addEventListener as any)("failed", handleEvent);
  (es.addEventListener as any)("timeout", handleEvent);

  es.addEventListener("error", () => {
    onError(new Error("SSE connection error"));
    es.close();
  });

  return { close: () => es.close() };
}
