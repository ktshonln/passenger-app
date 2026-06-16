/**
 * Hook for fetching wallet balance
 */

import {
  getWalletBalance,
  type WalletBalance,
} from "@/src/services/wallet.service";
import { useAuthStore } from "@/src/store/auth.store";
import { useEffect, useState } from "react";

export function useWallet() {
  const { token, isAuthenticated } = useAuthStore();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchBalance() {
    console.log("[useWallet] fetchBalance called, isAuthenticated:", isAuthenticated, "hasToken:", !!token);
    if (!isAuthenticated || !token) {
      console.log("[useWallet] Not authenticated or no token, setting balance to null");
      setBalance(null);
      return;
    }

    console.log("[useWallet] Fetching balance...");
    setLoading(true);
    setError(null);

    try {
      const data = await getWalletBalance(token);
      console.log("[useWallet] Received balance data:", data);
      setBalance(data);
    } catch (err) {
      console.error("[useWallet] Error fetching balance:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
      setBalance(null);
    } finally {
      console.log("[useWallet] Setting loading to false");
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("[useWallet] useEffect triggered, fetching balance...");
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  return { balance, loading, error, refetch: fetchBalance };
}
