import { LocationSuggestion } from "./api";

interface CacheEntry {
  results: LocationSuggestion[];
  fetchedAt: number; // Date.now()
}

const TTL_MS = 300_000; // 5 minutes
const MAX_ENTRIES = 30;

const cache = new Map<string, CacheEntry>();

export function get(query: string): LocationSuggestion[] | null {
  const entry = cache.get(query);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    cache.delete(query);
    return null;
  }
  return entry.results;
}

export function set(query: string, results: LocationSuggestion[]): void {
  // If key already exists, delete it first so insertion order is refreshed
  if (cache.has(query)) {
    cache.delete(query);
  }
  cache.set(query, { results, fetchedAt: Date.now() });
  // Evict oldest entry (first key in Map iteration order) if over limit
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
}

export function clear(): void {
  cache.clear();
}
