import { fetchLocations, LocationSuggestion } from "@/lib/api";
import * as locationCache from "@/lib/location-cache";
import { useEffect, useRef, useState } from "react";

interface LocationsState {
  results: LocationSuggestion[];
  loading: boolean;
  error: string | null;
}

export function useLocations(query: string) {
  const [state, setState] = useState<LocationsState>({
    results: [],
    loading: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 1. Short query — clear results and bail out
    if (!query || query.length < 1) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      try {
        abortRef.current?.abort();
      } catch {
        // AbortController may not be supported on all Hermes versions
      }
      setState({ results: [], loading: false, error: null });
      return;
    }

    // 2. Cache hit — return immediately, no fetch needed
    const cached = locationCache.get(query);
    if (cached) {
      setState({ results: cached, loading: false, error: null });
      return;
    }

    // 3. Clear previous debounce timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 4. Set new 300 ms debounce timer
    timerRef.current = setTimeout(async () => {
      // 5a. Abort any in-flight request
      try {
        abortRef.current?.abort();
      } catch {
        // safe to ignore
      }

      // 5b. Create a fresh controller for this request
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const results = await fetchLocations(query, controller.signal);
        // 5c. Write to cache on success
        locationCache.set(query, results);
        setState({ results, loading: false, error: null });
      } catch (err: unknown) {
        // 5d. Ignore AbortError — it means a newer query superseded this one
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setState({
          results: [],
          loading: false,
          error: "Could not load suggestions",
        });
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [query]);

  return { results: state.results, loading: state.loading, error: state.error };
}
