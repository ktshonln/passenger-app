import {
    getWalletTransactions,
    type WalletTransaction,
} from "@/src/services/wallet.service";
import { useAuthStore } from "@/src/store/auth.store";
import { useCallback, useEffect, useState } from "react";

export function useWalletTransactions(type?: "topup" | "payment", limit = 20) {
  const { token, isAuthenticated } = useAuthStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p = 1) => {
      if (!isAuthenticated || !token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getWalletTransactions(token, p, limit, type);
        setTransactions(res.data);
        setTotal(res.total);
        setPage(res.page);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load transactions",
        );
      } finally {
        setLoading(false);
      }
    },
    [token, isAuthenticated, type, limit],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const prependTransaction = (tx: WalletTransaction) => {
    setTransactions((prev) => [tx, ...prev]);
    setTotal((t) => t + 1);
  };

  return {
    transactions,
    total,
    page,
    loading,
    error,
    load,
    prependTransaction,
  };
}
