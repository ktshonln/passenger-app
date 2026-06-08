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
    if (!isAuthenticated || !token) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getWalletBalance(token);
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  return { balance, loading, error, refetch: fetchBalance };
}
