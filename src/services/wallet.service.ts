/**
 * Wallet Service
 * All wallet operations proxy through the User Service.
 * The frontend never calls the Payment Service directly.
 */

import { API_BASE_URL, USE_MOCK_DATA } from "@/lib/config";
import { MOCK_WALLET_BALANCE, mockDelay } from "./mock.data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletBalance {
  available: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: "topup" | "payment";
  amount: number;
  currency: string;
  status: "confirmed" | "failed" | "pending";
  description: string;
  created_at: string;
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

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx1",
    type: "topup",
    amount: 5000,
    currency: "RWF",
    status: "confirmed",
    description: "Top up via MTN MoMo",
    created_at: "2026-04-20T08:00:00Z",
  },
  {
    id: "tx2",
    type: "payment",
    amount: 3500,
    currency: "RWF",
    status: "confirmed",
    description: "Ticket: Kigali → Musanze",
    created_at: "2026-04-19T06:30:00Z",
  },
  {
    id: "tx3",
    type: "topup",
    amount: 10000,
    currency: "RWF",
    status: "confirmed",
    description: "Top up via Airtel Money",
    created_at: "2026-04-15T14:00:00Z",
  },
  {
    id: "tx4",
    type: "payment",
    amount: 2800,
    currency: "RWF",
    status: "confirmed",
    description: "Ticket: Nyabugogo → Huye",
    created_at: "2026-04-10T07:00:00Z",
  },
  {
    id: "tx5",
    type: "topup",
    amount: 2000,
    currency: "RWF",
    status: "failed",
    description: "Top up via MTN MoMo",
    created_at: "2026-04-08T11:00:00Z",
  },
  {
    id: "tx6",
    type: "payment",
    amount: 4200,
    currency: "RWF",
    status: "confirmed",
    description: "Ticket: Nyabugogo → Nyagatare",
    created_at: "2026-04-05T05:30:00Z",
  },
  {
    id: "tx7",
    type: "topup",
    amount: 8000,
    currency: "RWF",
    status: "pending",
    description: "Top up via MTN MoMo",
    created_at: "2026-04-01T09:00:00Z",
  },
];

// ─── API functions ────────────────────────────────────────────────────────────

export async function getWalletBalance(token: string): Promise<WalletBalance> {
  if (USE_MOCK_DATA) {
    await mockDelay(400);
    return MOCK_WALLET_BALANCE;
  }
  const res = await fetch(`${API_BASE_URL}/users/me/wallet`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch wallet balance");
  return res.json();
}

export async function getWalletTransactions(
  token: string,
  page = 1,
  limit = 20,
  type?: "topup" | "payment",
): Promise<WalletTransactionsResponse> {
  if (USE_MOCK_DATA) {
    await mockDelay(600);
    let filtered = MOCK_TRANSACTIONS;
    if (type) filtered = filtered.filter((t) => t.type === type);
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
    };
  }
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(type ? { type } : {}),
  });
  const res = await fetch(
    `${API_BASE_URL}/users/me/wallet/transactions?${qs}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function initiateTopup(
  token: string,
  req: TopupRequest,
): Promise<TopupResponse> {
  if (USE_MOCK_DATA) {
    await mockDelay(800);
    return { topup_id: `topup-${Date.now()}` };
  }
  const res = await fetch(`${API_BASE_URL}/users/me/wallet/topup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(req),
  });
  if (res.status === 400) {
    const body = await res.json();
    throw new Error(body?.error?.code ?? "INVALID_AMOUNT");
  }
  if (res.status === 422) {
    const body = await res.json();
    throw new Error(body?.error?.code ?? "INVALID_PHONE");
  }
  if (!res.ok) throw new Error("TOPUP_FAILED");
  return res.json();
}

export function createTopupSSE(
  token: string,
  topupId: string,
  onEvent: (e: TopupSSEEvent) => void,
  onError: (err: Error) => void,
): { close: () => void } {
  if (USE_MOCK_DATA) {
    // Simulate confirmed after 3 seconds
    const t = setTimeout(() => {
      onEvent({
        status: "confirmed",
        amount: 5000,
        currency: "RWF",
        new_balance: MOCK_WALLET_BALANCE.available + 5000,
        message: "Your wallet has been topped up successfully.",
      });
    }, 3000);
    return { close: () => clearTimeout(t) };
  }

  const url = `${API_BASE_URL}/users/me/wallet/topup/${topupId}/stream`;
  const es = new EventSource(url, {
    headers: { Authorization: `Bearer ${token}` },
  } as any);

  es.onmessage = (event) => {
    try {
      const data: TopupSSEEvent = JSON.parse(event.data);
      onEvent(data);
      if (data.status !== "pending") es.close();
    } catch {
      onError(new Error("Failed to parse SSE message"));
    }
  };
  es.onerror = () => {
    onError(new Error("SSE connection error"));
    es.close();
  };

  return { close: () => es.close() };
}
