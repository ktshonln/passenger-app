import { Company, fetchCompanies } from "@/lib/api";
import { MOCK_COMPANIES, mockDelay } from "@/src/services/mock.data";
import { useCallback, useEffect, useState } from "react";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await mockDelay(400);
        setCompanies(MOCK_COMPANIES);
      } else {
        setCompanies(await fetchCompanies());
      }
    } catch {
      setError("Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { companies, loading, error, reload: load };
}
