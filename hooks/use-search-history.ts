import {
    clearSearchHistory,
    deleteSearchHistoryItem,
    fetchSearchHistory,
    getAuthToken,
    saveSearchHistory,
    SearchHistoryItem,
} from "@/lib/api";
import { useAuthStore } from "@/src/store/auth.store";
import { useCallback, useEffect, useState } from "react";

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const load = useCallback(async () => {
    if (!isAuthenticated || !getAuthToken()) {
      setHistory([]);
      return;
    }
    setLoading(true);
    try {
      setHistory(await fetchSearchHistory());
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const save = useCallback(
    async (item: Omit<SearchHistoryItem, "id" | "searchedAt">) => {
      if (!getAuthToken()) return;
      try {
        const saved = await saveSearchHistory(item);
        setHistory((prev) => [saved, ...prev.slice(0, 9)]);
      } catch {
        /* non-critical */
      }
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    try {
      await deleteSearchHistoryItem(id);
    } catch {
      /* ignore */
    }
  }, []);

  const clear = useCallback(async () => {
    setHistory([]);
    try {
      await clearSearchHistory();
    } catch {
      /* ignore */
    }
  }, []);

  // Clear local history on sign-out
  useEffect(() => {
    if (!isAuthenticated) setHistory([]);
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  return { history, loading, save, remove, clear };
}
