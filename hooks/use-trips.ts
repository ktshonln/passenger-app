import { fetchTrips, Trip, TripSearchParams } from "@/lib/api";
import { useCallback, useState } from "react";

const LIMIT = 20;

interface TripsState {
  trips: Trip[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  searched: boolean;
  page: number;
  hasMore: boolean;
  lastParams: TripSearchParams | null;
}

const initialState: TripsState = {
  trips: [],
  loading: false,
  loadingMore: false,
  error: null,
  searched: false,
  page: 1,
  hasMore: false,
  lastParams: null,
};

export function useTrips() {
  const [state, setState] = useState<TripsState>(initialState);

  const search = useCallback(async (params: TripSearchParams) => {
    setState((s) => ({
      ...s,
      loading: true,
      loadingMore: false,
      error: null,
      searched: true,
      trips: [],
      page: 1,
      hasMore: false,
      lastParams: params,
    }));
    try {
      const results = await fetchTrips({ ...params, page: 1, limit: LIMIT });
      setState((s) => ({
        ...s,
        trips: results,
        hasMore: results.length >= LIMIT,
        loading: false,
      }));
    } catch {
      setState((s) => ({
        ...s,
        error: "Failed to load trips. Please try again.",
        trips: [],
        loading: false,
      }));
    }
  }, []);

  const loadMore = useCallback(async () => {
    setState((s) => {
      if (!s.hasMore || s.loadingMore || !s.lastParams) return s;
      const nextPage = s.page + 1;

      (async () => {
        try {
          const results = await fetchTrips({
            ...s.lastParams!,
            page: nextPage,
            limit: LIMIT,
          });
          setState((prev) => ({
            ...prev,
            trips: [...prev.trips, ...results],
            page: nextPage,
            hasMore: results.length >= LIMIT,
            loadingMore: false,
          }));
        } catch {
          setState((prev) => ({
            ...prev,
            error: "Failed to load more trips. Please try again.",
            loadingMore: false,
          }));
        }
      })();

      return { ...s, loadingMore: true };
    });
  }, []);

  const retry = useCallback(async () => {
    setState((s) => {
      if (!s.lastParams) return s;
      const params = s.lastParams;

      (async () => {
        try {
          const results = await fetchTrips({
            ...params,
            page: 1,
            limit: LIMIT,
          });
          setState((prev) => ({
            ...prev,
            trips: results,
            page: 1,
            hasMore: results.length >= LIMIT,
            loading: false,
            error: null,
          }));
        } catch {
          setState((prev) => ({
            ...prev,
            error: "Failed to load trips. Please try again.",
            trips: [],
            loading: false,
          }));
        }
      })();

      return {
        ...s,
        loading: true,
        loadingMore: false,
        error: null,
        trips: [],
        page: 1,
        hasMore: false,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    trips: state.trips,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    searched: state.searched,
    page: state.page,
    hasMore: state.hasMore,
    lastParams: state.lastParams,
    search,
    loadMore,
    retry,
    reset,
  };
}
