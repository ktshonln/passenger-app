# Tasks — Trip Search & Discovery Bugfix

## Phase 1: Foundation (types, cache, API layer)

- [x] 1.1 Update `TripSearchParams` in `lib/api.ts` to add `timeFrom`, `timeTo`, `page`, `limit` fields
- [x] 1.2 Update `fetchTrips` in `lib/api.ts` to forward new params as `time_from`, `time_to`, `page`, `limit` query params; handle both array and `{ data, meta }` response shapes
- [x] 1.3 Add `fetchPublicOrganizations` to `lib/api.ts` with `PublicOrganization` type; no auth header; mock branch returns mapped `MOCK_COMPANIES`
- [x] 1.4 Update `fetchLocations` in `lib/api.ts` to accept an optional `AbortSignal` and forward it to `fetch()`
- [x] 1.5 Create `lib/location-cache.ts` — LRU in-memory cache, max 30 entries, 5-minute TTL, `get(query)` / `set(query, results)` / `clear()` API

## Phase 2: Hook fixes

- [x] 2.1 Rewrite `hooks/use-locations.ts` — combine debounce (300 ms) + `AbortController`; read from cache before fetching; write to cache after successful fetch
- [x] 2.2 Rewrite `hooks/use-trips.ts` — add `page`, `hasMore`, `loadingMore`, `lastParams` state; implement `loadMore()` and `retry()`; reset page on new `search()` call
- [x] 2.3 Rewrite `hooks/use-companies.ts` — call `fetchPublicOrganizations` unconditionally (no auth guard); map `PublicOrganization` → `Company`

## Phase 3: New UI components

- [x] 3.1 Create `components/search/trip-card-skeleton.tsx` — three shimmer placeholder cards using `Animated.loop`
- [x] 3.2 Create `components/search/trip-card.tsx` — extracted `TripCard` with `<Image>` logo, `resolveLogoUrl` helper, initial-letter fallback, `onError` handler
- [x] 3.3 Create `components/search/filter-sheet.tsx` — extracted `FilterSheet` with internal draft state, Apply/Reset/Close buttons, `<Image>` logos for companies
- [x] 3.4 Create `components/search/time-range-picker.tsx` — from-time / to-time picker; `@react-native-community/datetimepicker` on native, `TextInput` on web; wrapped in `ErrorBoundary`

## Phase 4: Modify existing components

- [x] 4.1 Update `components/search/location-input.tsx` — remove all `(item as any)` casts; use `LocationSuggestion` type directly
- [x] 4.2 Update `components/search/search-card.tsx` — add "Add time filter" chip that toggles `TimeRangePicker`; pass `timeFrom`/`timeTo` through `SearchValues`

## Phase 5: Wire everything in `explore.tsx`

- [x] 5.1 Replace inline `TripCard` with imported `TripCard` component
- [x] 5.2 Replace inline `FilterSheet` with imported `FilterSheet` component; adopt draft-state `onApply` pattern
- [x] 5.3 Add `TripCardSkeleton` to `ListHeaderComponent` — shown when `loading && trips.length === 0`
- [x] 5.4 Add `ErrorBanner` component — shown when `error` is non-null; includes Retry button wired to `retry()`
- [x] 5.5 Wire `FlatList.onEndReached` to `loadMore()`; add footer loading indicator and "No more trips" footer
- [x] 5.6 Pass `timeFrom`/`timeTo` from `SearchCard.onSearch` into `searchTrips()` params

## Phase 6: Tests

- [x] 6.1 Create `src/tests/search/location-cache.test.ts` — 5 tests covering store, retrieve, TTL expiry, eviction, overwrite
- [x] 6.2 Create `src/tests/search/use-locations.test.ts` — 6 tests covering debounce, abort, cache hit, error state, clear
- [x] 6.3 Create `src/tests/search/use-trips.test.ts` — 7 tests covering reset, loadMore, hasMore, retry, error, loadingMore state
- [x] 6.4 Modify `src/tests/hooks/use-companies.test.ts` — add 5 tests for public API call, logo mapping, no-auth requirement
- [x] 6.5 Create `src/tests/search/trip-card.test.tsx` — 6 tests covering logo image, fallback, urgency badge, onBook
- [x] 6.6 Create `src/tests/search/trip-card-skeleton.test.tsx` — 3 tests covering render count, no text, animation
- [x] 6.7 Create `src/tests/search/filter-sheet.test.tsx` — 6 tests covering draft init, Apply, Close, Reset, logo image
- [x] 6.8 Create `src/tests/search/search-card.test.tsx` — 4 tests covering time picker toggle, time values in callback, validation
- [x] 6.9 Create `src/tests/search/explore.test.tsx` — 8 integration tests covering skeleton, error banner, retry, pagination, empty state
