# Design Document — Trip Search & Discovery

## 1. Feature Breakdown

This spec fixes twelve defects in `app/(tabs)/explore.tsx` and its supporting hooks/components. Each fix is scoped to the smallest possible change surface.

| #   | Defect                                     | Fix Area                                                                        |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| 1   | Race conditions in location fetch          | `hooks/use-locations.ts` — AbortController                                      |
| 2   | No skeleton loading UI                     | new `components/search/trip-card-skeleton.tsx`                                  |
| 3   | No empty state UI                          | `app/(tabs)/explore.tsx` — `EmptyState` component                               |
| 4   | Location autocomplete missing rich info    | `lib/api.ts` types + `components/search/location-input.tsx`                     |
| 5   | Filter panel doesn't persist draft state   | `components/search/filter-sheet.tsx` — draft state pattern                      |
| 6   | No atomic debounce + abort on search input | `hooks/use-locations.ts` — combined debounce + abort                            |
| 7   | Companies use mock data, not public API    | `lib/api.ts` + `hooks/use-companies.ts`                                         |
| 8   | Date-time picker missing from search card  | `components/search/search-card.tsx` + `components/search/time-range-picker.tsx` |
| 9   | No pagination / infinite scroll            | `hooks/use-trips.ts` + `app/(tabs)/explore.tsx`                                 |
| 10  | Trip card missing real company logo        | `components/search/trip-card.tsx` — Image + fallback                            |
| 11  | No error state when API fails              | `app/(tabs)/explore.tsx` — `ErrorBanner` component                              |
| 12  | No caching of search suggestions           | `lib/location-cache.ts` — LRU cache                                             |

---

## 2. File Structure Plan

Only files that change or are newly created are listed. No new top-level folders are introduced.

```
lib/
  api.ts                          MODIFY — add fetchPublicOrganizations, pagination params, time range params
  location-cache.ts               NEW    — LRU in-memory cache for location suggestions

hooks/
  use-locations.ts                MODIFY — AbortController + cache integration
  use-trips.ts                    MODIFY — pagination (page, limit), time range params
  use-companies.ts                MODIFY — call fetchPublicOrganizations, remove auth guard

components/search/
  search-card.tsx                 MODIFY — add TimeRangePicker row
  location-input.tsx              MODIFY — remove (any) casts, use LocationSuggestion type
  filter-sheet.tsx                NEW    — extracted + draft-state filter panel (was inline in explore.tsx)
  trip-card.tsx                   NEW    — extracted TripCard with real Image logo + fallback
  trip-card-skeleton.tsx          NEW    — shimmer skeleton for loading state
  time-range-picker.tsx           NEW    — from-time / to-time picker row

app/(tabs)/
  explore.tsx                     MODIFY — wire all fixes, add error banner, infinite scroll, import new components

src/tests/search/
  use-locations.test.ts           NEW    — Jest tests for abort + cache
  use-trips.test.ts               NEW    — Jest tests for pagination
  use-companies.test.ts           MODIFY — add public API tests
  location-cache.test.ts          NEW    — Jest tests for LRU cache
  trip-card.test.tsx              NEW    — Jest tests for logo image + fallback
  trip-card-skeleton.test.tsx     NEW    — Jest tests for skeleton render
  filter-sheet.test.tsx           NEW    — Jest tests for draft state
  search-card.test.tsx            NEW    — Jest tests for time range picker integration
  explore.test.tsx                NEW    — Jest integration tests for error banner + pagination
```

---

## 3. State Management Plan

All state lives in React component state or custom hooks. No new global store is introduced.

### 3.1 `useTrips` hook state

```ts
interface TripsState {
  trips: Trip[]; // accumulated across pages
  loading: boolean; // true during first page fetch
  loadingMore: boolean; // true during subsequent page fetches
  error: string | null;
  searched: boolean;
  page: number; // current page (1-indexed)
  hasMore: boolean; // false when API returns < limit results
  lastParams: TripSearchParams | null; // stored for retry + loadMore
}
```

Actions: `search(params)` — resets to page 1; `loadMore()` — increments page; `retry()` — re-runs `lastParams`; `reset()`.

### 3.2 `useLocations` hook state

```ts
interface LocationsState {
  results: LocationSuggestion[];
  loading: boolean;
  error: string | null;
}
```

Internal refs: `abortRef: AbortController | null`, `timerRef: ReturnType<typeof setTimeout> | null`.

Flow: on query change → clear timer → set new timer (300 ms) → on fire: abort previous controller, create new one, call `fetchLocations(query, signal)`, write result to cache.

### 3.3 `FilterSheet` draft state

`FilterSheet` receives the currently-applied values as props and initialises local draft state from them on every open (`useEffect` on `visible`). The "Apply" button calls `onApply(draft)` which updates the parent. The "Close" button discards the draft.

```ts
// Parent (explore.tsx)
const [appliedFilters, setAppliedFilters] =
  useState<FilterValues>(defaultFilters);

// FilterSheet internal
const [draft, setDraft] = useState<FilterValues>(appliedFilters);
useEffect(() => {
  if (visible) setDraft(appliedFilters);
}, [visible]);
```

### 3.4 Location suggestion cache (`lib/location-cache.ts`)

```ts
interface CacheEntry {
  results: LocationSuggestion[];
  fetchedAt: number; // Date.now()
}
// Map<query, CacheEntry>, max 30 entries, 5-minute TTL
// Eviction: delete oldest entry when size > 30
```

---

## 4. API Integration Plan

### 4.1 Updated `TripSearchParams`

```ts
export interface TripSearchParams {
  from: string;
  to: string;
  date: string;
  operatorId?: string;
  timeFrom?: string; // "HH:mm" e.g. "06:00"
  timeTo?: string; // "HH:mm" e.g. "12:00"
  page?: number; // default 1
  limit?: number; // default 20
}
```

`fetchTrips` maps these to `q`, `origin_id`, `company_id`, `date`, `time_from`, `time_to`, `page`, `limit` query params as documented by the backend.

### 4.2 New `fetchPublicOrganizations`

```ts
export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  logo_path: string | null;
  story: string | null;
}

export async function fetchPublicOrganizations(
  query = "",
  page = 1,
  limit = 50,
): Promise<PublicOrganization[]>;
// GET /api/v1/organizations/public?q=&page=1&limit=50
// No auth header required
```

`useCompanies` maps `PublicOrganization` → `Company` (using `logo_path` as `logoUrl`, `name` as both `name` and `shortName` until a `short_name` field is available).

### 4.3 Updated `fetchLocations` signature

```ts
export async function fetchLocations(
  query: string,
  signal?: AbortSignal,
): Promise<LocationSuggestion[]>;
```

The `signal` is forwarded to `fetch()` so the browser/RN networking layer cancels the request when the controller is aborted.

### 4.4 Pagination response contract

The backend returns a plain array for `/api/v1/trips`. When the array length is less than `limit`, `hasMore` is set to `false`. If the backend later wraps results in `{ data, meta }`, only `fetchTrips` needs updating.

### 4.5 Mock mode parity

All new API functions get mock branches gated on `EXPO_PUBLIC_USE_MOCK=true`:

- `fetchPublicOrganizations` → returns `MOCK_COMPANIES` mapped to `PublicOrganization`
- `fetchTrips` with pagination → slices `MOCK_TRIPS` by `(page-1)*limit` to `page*limit`
- `fetchLocations` with signal → uses existing `getMockLocationSuggestions`, ignores signal

---

## 5. UI Component Plan

### 5.1 `TripCardSkeleton` (`components/search/trip-card-skeleton.tsx`)

- Three placeholder cards rendered when `loading === true` and `trips.length === 0`
- Uses `Animated.loop` + `Animated.sequence` for shimmer (opacity 0.4 → 1 → 0.4, 1200 ms)
- Matches `TripCard` layout: header row, route row, footer row — all replaced with rounded grey boxes
- No props required

### 5.2 `TripCard` (`components/search/trip-card.tsx`)

Extracted from the inline `TripCard` function in `explore.tsx`. Additions:

- `<Image source={{ uri: resolveLogoUrl(company?.logoUrl) }} style={S.logo} />`
- `resolveLogoUrl`: if value starts with `http` use as-is; if it starts with `/` prepend `BASE_URL`; otherwise render fallback
- Fallback: a `View` with the first letter of `trip.operator` in brand color `#0A4370`
- `onError` on `<Image>` switches to fallback via local boolean state

Props: `trip: Trip`, `company: Company | undefined`, `onBook: () => void`, `t: TFunction`

### 5.3 `FilterSheet` (`components/search/filter-sheet.tsx`)

Extracted from inline `FilterSheet` in `explore.tsx`. Additions:

- Internal `draft` state initialised from props on `visible` change
- "Apply" button calls `onApply(draft)` and then `onClose()`
- "Reset" button restores draft to defaults without closing
- Company chips use `<Image>` for logo with initial-letter fallback (same pattern as TripCard)

Props:

```ts
interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  applied: FilterValues;
  companies: Company[];
  t: TFunction;
}
```

### 5.4 `TimeRangePicker` (`components/search/time-range-picker.tsx`)

- Two time inputs: "From time" and "To time"
- Uses `@react-native-community/datetimepicker` in `time` mode on iOS/Android
- On web: plain `TextInput` with `HH:mm` mask
- Renders inline below the date picker row in `SearchCard`
- Optional — only shown when user taps "Add time filter" chip; hidden by default to keep the card compact

Props: `fromTime: string`, `toTime: string`, `onChange: (from: string, to: string) => void`

### 5.5 `ErrorBanner` (inline in `explore.tsx`)

- Full-width red-tinted banner below the results bar
- Shows localised error message from `useTrips().error`
- "Retry" button calls `retry()` from `useTrips`
- Animated slide-down entrance

### 5.6 `EmptyState` (inline in `explore.tsx`)

Already partially exists as `ListEmptyComponent`. Additions:

- Bus illustration (SVG or existing `bus-outline` icon at 64 px)
- Localised headline + hint
- "Clear filters" button when `activeFilterCount > 0`
- "Try different dates" suggestion link

---

## 6. Jest Testing Plan

All test files go under `src/tests/search/`. Tests use Jest + `@testing-library/react-native`. Mocks for `fetch` use `jest.fn()` / `msw` where appropriate.

### 6.1 `location-cache.test.ts`

| Test                                     | Assertion                               |
| ---------------------------------------- | --------------------------------------- |
| stores and retrieves a result by query   | `get("kig")` returns stored entry       |
| returns null for unknown query           | `get("xyz")` → `null`                   |
| returns null for expired entry (TTL)     | entry older than 5 min → `null`         |
| evicts oldest entry when size exceeds 30 | after 31 inserts, oldest key is gone    |
| `set` overwrites existing entry          | second `set("kig", ...)` replaces first |

### 6.2 `use-locations.test.ts`

| Test                                           | Assertion                                    |
| ---------------------------------------------- | -------------------------------------------- |
| does not fetch when query < 2 chars            | `fetch` not called                           |
| debounces — only one fetch after rapid changes | `fetch` called once after 300 ms             |
| aborts previous request when query changes     | first `AbortController.abort` called         |
| returns cached result without fetching         | `fetch` not called on second identical query |
| sets error state on fetch failure              | `error` is non-null                          |
| clears results when query is cleared           | `results` becomes `[]`                       |

### 6.3 `use-trips.test.ts`

| Test                                                    | Assertion                              |
| ------------------------------------------------------- | -------------------------------------- |
| `search()` resets page to 1 and clears previous results | `trips` is fresh array                 |
| `loadMore()` appends results and increments page        | `trips.length` grows                   |
| `hasMore` is false when API returns < 20 results        | `hasMore === false`                    |
| `hasMore` is true when API returns exactly 20 results   | `hasMore === true`                     |
| `retry()` re-calls fetch with `lastParams`              | `fetch` called again with same params  |
| sets `error` on API failure                             | `error` is non-null, `trips` unchanged |
| `loadingMore` is true during `loadMore` fetch           | intermediate state check               |

### 6.4 `use-companies.test.ts` (extends existing)

| Test                                                     | Assertion                                       |
| -------------------------------------------------------- | ----------------------------------------------- |
| calls `/api/v1/organizations/public` without auth header | `Authorization` header absent                   |
| maps `logo_path` to `logoUrl`                            | `companies[0].logoUrl === "/logos/volcano.png"` |
| maps `name` to both `name` and `shortName`               | both fields populated                           |
| handles empty response gracefully                        | `companies === []`                              |
| does not require `isAuthenticated` to load               | loads even when `isAuthenticated === false`     |

### 6.5 `trip-card.test.tsx`

| Test                                                    | Assertion                           |
| ------------------------------------------------------- | ----------------------------------- |
| renders operator name                                   | text present                        |
| renders `<Image>` when `company.logoUrl` is a URL       | `Image` component in tree           |
| renders initial-letter fallback when `logoUrl` is emoji | no `Image`, fallback `View` present |
| renders initial-letter fallback on image `onError`      | fallback shown after error event    |
| shows urgency badge when `seatsAvailable <= 5`          | badge text present                  |
| calls `onBook` when "Book Now" pressed                  | mock called once                    |

### 6.6 `trip-card-skeleton.test.tsx`

| Test                                     | Assertion                            |
| ---------------------------------------- | ------------------------------------ |
| renders three skeleton cards             | three placeholder containers in tree |
| skeleton containers have no text content | no readable text                     |
| animation starts on mount                | `Animated.loop` called               |

### 6.7 `filter-sheet.test.tsx`

| Test                                                   | Assertion                                |
| ------------------------------------------------------ | ---------------------------------------- |
| initialises draft from `applied` prop on open          | displayed sort matches `applied.sortKey` |
| draft changes do not affect parent until Apply         | `onApply` not called on chip tap         |
| Apply button calls `onApply` with draft values         | `onApply` called with updated draft      |
| Close button calls `onClose` without calling `onApply` | `onApply` not called                     |
| Reset button restores draft to defaults                | draft reverts, `onApply` not called      |
| company chips render `<Image>` for URL logos           | `Image` in tree                          |

### 6.8 `search-card.test.tsx`

| Test                                                           | Assertion                           |
| -------------------------------------------------------------- | ----------------------------------- |
| "Add time filter" chip toggles `TimeRangePicker` visibility    | picker shown/hidden                 |
| `onSearch` receives `timeFrom` and `timeTo` when set           | values present in callback arg      |
| `onSearch` receives `undefined` time values when picker hidden | values absent                       |
| existing validation still blocks empty from/to/date            | errors shown, `onSearch` not called |

### 6.9 `explore.test.tsx`

| Test                                                                | Assertion                  |
| ------------------------------------------------------------------- | -------------------------- |
| shows skeleton cards while `loading === true`                       | `TripCardSkeleton` in tree |
| hides skeleton when `loading === false`                             | skeleton not in tree       |
| shows `ErrorBanner` when `error` is non-null                        | error text present         |
| Retry button in `ErrorBanner` calls `retry()`                       | mock called                |
| `loadMore` called when FlatList `onEndReached` fires                | `loadMore` mock called     |
| footer loading indicator shown during `loadingMore`                 | indicator in tree          |
| "No more trips" footer shown when `hasMore === false`               | text present               |
| empty state shown when `searched && trips.length === 0 && !loading` | empty state in tree        |

---

## 7. Done Criteria

A fix is considered complete when ALL of the following are true:

**Fix 1 — Race conditions**

- [ ] Typing 5 characters in rapid succession results in exactly 1 network request (verified via test mock call count)
- [ ] Changing query while a request is in-flight causes the previous `AbortController` to be aborted

**Fix 2 — Skeleton loading**

- [ ] Three skeleton cards are visible immediately after `search()` is called and before the response arrives
- [ ] Skeleton cards disappear when results or an error are received

**Fix 3 — Empty state**

- [ ] Empty state renders when `searched === true && trips.length === 0 && !loading`
- [ ] "Clear filters" button appears only when `activeFilterCount > 0`

**Fix 4 — Rich location autocomplete**

- [ ] `tripsToday` badge renders for every suggestion that has `tripsToday > 0`
- [ ] `popularDestinations` chips render when the field is non-empty
- [ ] No `(item as any)` casts remain in `location-input.tsx`

**Fix 5 — Filter panel draft state**

- [ ] Opening the filter panel always shows the currently applied values
- [ ] Closing without applying does not change the applied filters
- [ ] Applying updates the parent state

**Fix 6 — Debounce + abort**

- [ ] At most one `fetchLocations` request is in-flight at any time
- [ ] 300 ms debounce is enforced end-to-end

**Fix 7 — Public organizations API**

- [ ] `GET /api/v1/organizations/public` is called on mount regardless of auth state
- [ ] No `Authorization` header is sent with this request
- [ ] `logo_path` is used as `logoUrl`

**Fix 8 — Date-time picker**

- [ ] "Add time filter" chip is visible in the search card
- [ ] Selecting times passes `time_from` and `time_to` to `fetchTrips`

**Fix 9 — Pagination**

- [ ] First search sends `page=1&limit=20`
- [ ] Scrolling to the bottom triggers `loadMore()` and appends results
- [ ] `hasMore === false` stops further requests

**Fix 10 — Company logo image**

- [ ] `<Image>` is rendered when `logoUrl` is an HTTP(S) URL
- [ ] Initial-letter fallback is shown for emoji or null values
- [ ] `onError` on `<Image>` switches to fallback

**Fix 11 — Error state**

- [ ] `ErrorBanner` is visible when `useTrips().error` is non-null
- [ ] Retry button re-executes the last search
- [ ] No blank screen is shown on API failure

**Fix 12 — Suggestion cache**

- [ ] Second identical query returns cached results with 0 network requests
- [ ] Cache entries expire after 5 minutes
- [ ] Cache is evicted when it exceeds 30 entries

**General**

- [ ] All 9 new/modified test files pass (`jest --testPathPattern=src/tests/search`)
- [ ] `getDiagnostics` reports 0 TypeScript errors across all modified files
- [ ] Mock mode (`EXPO_PUBLIC_USE_MOCK=true`) still works end-to-end
- [ ] Existing auth, booking, and profile flows are unaffected

---

## 8. Risks and Backend Integration Safeguards

### 8.1 `/api/v1/organizations/public` response shape mismatch

**Risk:** The real endpoint may return a different field name for the logo (e.g. `logo_url` instead of `logo_path`) or wrap results in `{ data: [], meta: {} }`.

**Safeguard:** `fetchPublicOrganizations` validates the response with a runtime type guard before mapping. If the shape is unexpected it logs a warning and returns `[]` rather than crashing. A `TODO` comment marks the mapping function for easy update once the real response is confirmed.

### 8.2 Pagination — array vs. envelope response

**Risk:** `GET /api/v1/trips` may return `{ data: Trip[], total: number, page: number }` rather than a plain array.

**Safeguard:** `fetchTrips` checks `Array.isArray(body)`. If false, it reads `body.data`. `hasMore` is derived from `body.data.length < limit` or `body.meta.total > page * limit` if `meta` is present. Both paths are covered by unit tests.

### 8.3 AbortController in React Native

**Risk:** Older Hermes versions may not fully support `AbortController` / `AbortSignal`.

**Safeguard:** `lib/location-cache.ts` wraps the abort call in `try/catch`. If `AbortController` is unavailable (detected via `typeof AbortController === 'undefined'`), the hook falls back to the existing debounce-only behaviour and logs a dev warning.

### 8.4 `@react-native-community/datetimepicker` availability

**Risk:** The package may not be installed or may behave differently across iOS/Android/web.

**Safeguard:** `TimeRangePicker` checks `Platform.OS` and renders a plain `TextInput` with `HH:mm` validation on web. The component is wrapped in an `ErrorBoundary` so a crash in the picker does not take down the search card.

### 8.5 Image loading for company logos

**Risk:** `logo_path` values from the API may be relative paths, absolute URLs, or null.

**Safeguard:** `resolveLogoUrl(path)` normalises the value: null/empty → fallback; starts with `http` → use as-is; starts with `/` → prepend `EXPO_PUBLIC_API_BASE_URL`. The `<Image>` component always has an `onError` handler that switches to the initial-letter fallback, so a broken URL never shows a broken image icon.

### 8.6 Cache invalidation across sessions

**Risk:** Stale cached suggestions could persist if the user keeps the app open for a long time.

**Safeguard:** The LRU cache is in-memory only (not persisted to AsyncStorage). It is cleared automatically on app restart. The 5-minute TTL ensures suggestions are refreshed frequently enough for a transport app context.

### 8.7 Filter state divergence after back-navigation

**Risk:** If the user navigates away and back, `appliedFilters` in `explore.tsx` resets to defaults because the screen re-mounts.

**Safeguard:** This is acceptable for the current scope. A follow-up spec can persist filter state to a Zustand slice or React Navigation state params. A `TODO` comment is added in `explore.tsx` to mark this.
