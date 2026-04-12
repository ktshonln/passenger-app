import {
    clearSearchHistory,
    deleteSearchHistoryItem,
    fetchSearchHistory,
    saveSearchHistory,
    SearchHistoryItem,
} from "@/lib/api";
import { MOCK_SEARCH_HISTORY, mockDelay } from "@/src/services/mock.data";
import { useCallback, useEffect, useState } from "react";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (USE_MOCK) {
        await mockDelay(200);
        setHistory(MOCK_SEARCH_HISTORY);
      } else {
        setHistory(await fetchSearchHistory());
      }
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(
    async (item: Omit<SearchHistoryItem, "id" | "searchedAt">) => {
      try {
        if (USE_MOCK) {
          const newItem: SearchHistoryItem = {
            ...item,
            id: `sh-${Date.now()}`,
            searchedAt: new Date().toISOString(),
          };
          setHistory((prev) => [newItem, ...prev.slice(0, 9)]); // keep last 10
        } else {
          const saved = await saveSearchHistory(item);
          setHistory((prev) => [saved, ...prev.slice(0, 9)]);
        }
      } catch {
        // non-critical — silently ignore
      }
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (!USE_MOCK) {
      try {
        await deleteSearchHistoryItem(id);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const clear = useCallback(async () => {
    setHistory([]);
    if (!USE_MOCK) {
      try {
        await clearSearchHistory();
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { history, loading, save, remove, clear };
}
