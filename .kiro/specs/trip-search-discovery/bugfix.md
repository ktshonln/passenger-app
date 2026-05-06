# Bugfix Requirements Document

## Introduction

The Passenger Trip Search & Discovery page (`app/(tabs)/explore.tsx`) exists and renders, but contains twelve distinct defects that degrade reliability, performance, and user experience. These range from race conditions that produce stale results, to missing loading/empty/error states that leave users with a blank screen, to mock data that was never wired to real APIs. This document captures every defect, the correct behavior that must replace it, and the existing behavior that must be preserved unchanged.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user types quickly in a location input field THEN the system fires a new `fetchLocations` network request on every keystroke without cancelling the previous in-flight request, causing race conditions where an earlier slow response can overwrite a later fast response with stale suggestions.

1.2 WHEN a trip search is in progress THEN the system shows a blank results area with no visual feedback, leaving the user uncertain whether the app is working.

1.3 WHEN a trip search completes and the API returns zero results THEN the system renders an empty `FlatList` with no illustration, message, or call-to-action, giving the user no guidance.

1.4 WHEN the location autocomplete dropdown renders suggestions THEN the system displays `tripsToday` and `popularDestinations` only when the mock data happens to include them, because the `LocationSuggestion` fields are cast with `(item as any)` and the real `/api/v1/locations` endpoint contract is not enforced.

1.5 WHEN the user opens the filter panel, changes sort/bus-type/company filters, then closes and reopens the panel THEN the system resets the visual selection state inside `FilterSheet` because the component re-reads props on every open without persisting draft state, causing the displayed selection to diverge from the applied selection.

1.6 WHEN the user types in the search card's location inputs THEN the system triggers a debounced fetch on every character change; however the debounce is only applied inside `useLocations` and not at the `SearchCard` level, so rapid typing still schedules multiple timers that are not cancelled atomically when a new search is submitted.

1.7 WHEN the company/operator filter dropdown is populated THEN the system uses `MOCK_COMPANIES` from `src/services/mock.data.ts` via `useCompanies`, which only calls the real API when `isAuthenticated && getAuthToken()` is truthy, meaning unauthenticated users always see mock data and the public `/api/v1/organizations/public` endpoint is never called.

1.8 WHEN the user opens the search card THEN the system does not provide a date-time picker that allows filtering trips by a specific departure time range; only a date picker exists, so time-of-day filtering is impossible.

1.9 WHEN a search returns more than the first page of results THEN the system has no pagination or infinite-scroll mechanism; `fetchTrips` sends no `page` or `limit` parameters and the UI never requests additional pages, so results beyond the first page are silently dropped.

1.10 WHEN a trip result card renders the operator logo THEN the system displays an emoji string from `Company.logoUrl` (e.g. `"🌋"`) instead of a real image, because `useCompanies` returns mock data and the `TripCard` component has no `<Image>` element for the logo.

1.11 WHEN the `/api/v1/trips` request fails with a network error or non-2xx status THEN the system sets `error` state in `useTrips` but `explore.tsx` never reads or renders that error state, leaving the user with a blank results area identical to the loading state.

1.12 WHEN the user types the same location query a second time THEN the system re-fetches `/api/v1/locations` from the network with no in-memory cache, causing redundant requests and slower perceived performance.

---

### Expected Behavior (Correct)

2.1 WHEN the user types quickly in a location input field THEN the system SHALL cancel any in-flight `fetchLocations` request using an `AbortController` before issuing a new one, ensuring only the response for the most recent query is applied to state.

2.2 WHEN a trip search is in progress THEN the system SHALL render a skeleton loading UI consisting of three placeholder trip cards with animated shimmer, so the user receives immediate visual feedback.

2.3 WHEN a trip search completes and the API returns zero results THEN the system SHALL display an empty-state illustration, a localised "No trips found" headline, a hint message, and — when filters are active — a "Clear filters" button.

2.4 WHEN the location autocomplete dropdown renders suggestions THEN the system SHALL display the `tripsToday` count badge and `popularDestinations` chips for every suggestion that includes those fields, using the typed `LocationSuggestion` interface without `any` casts, sourced from the real `/api/v1/locations?q=` endpoint.

2.5 WHEN the user opens the filter panel THEN the system SHALL initialise the panel's internal draft state from the currently applied filter values, so the displayed selection always matches what is applied, and changes are only committed when the user taps "Apply".

2.6 WHEN the user types in a location input THEN the system SHALL apply a single 300 ms debounce at the `useLocations` hook level AND abort the previous request via `AbortController` so that at most one request is in-flight at any time.

2.7 WHEN the company/operator filter is loaded THEN the system SHALL call `GET /api/v1/organizations/public?page=1&limit=50` regardless of authentication state, mapping the response fields (`id`, `name`, `slug`, `org_type`, `logo_path`) to the `Company` type used by the filter UI.

2.8 WHEN the user opens the search card THEN the system SHALL provide a departure time range picker (from-time / to-time) below the date picker, and SHALL pass the selected time range as `time_from` and `time_to` query parameters to `GET /api/v1/trips`.

2.9 WHEN the user scrolls to the bottom of the trip results list THEN the system SHALL automatically fetch the next page using `page` and `limit=20` query parameters, append the new results to the existing list, and show a footer loading indicator; when no more pages exist the system SHALL show a "No more trips" footer.

2.10 WHEN a trip result card renders the operator logo THEN the system SHALL display a `<Image>` component sourced from `Company.logo_path` (resolved against the API base URL), with a branded-initial fallback view shown while the image loads or if it fails.

2.11 WHEN the `/api/v1/trips` request fails THEN the system SHALL display a full-width error banner with the localised error message, a retry button that re-executes the last search, and SHALL NOT show a blank screen.

2.12 WHEN the user types a location query that was fetched within the current app session THEN the system SHALL return the cached result immediately from an in-memory LRU cache (max 30 entries, 5-minute TTL) without making a network request, and SHALL still update the cache in the background if the TTL has expired.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user submits a valid search with origin, destination, and date THEN the system SHALL CONTINUE TO call `GET /api/v1/trips` with `from`, `to`, `date`, and optional `operator_id` parameters and render the returned trips in the results list.

3.2 WHEN the user taps "Book Now" on a trip card THEN the system SHALL CONTINUE TO navigate to `/booking` with the serialised trip object as a route parameter.

3.3 WHEN the user taps a recent search history item THEN the system SHALL CONTINUE TO pre-fill the search card and trigger a search automatically.

3.4 WHEN the user taps a popular route chip THEN the system SHALL CONTINUE TO pre-fill the search card with that route's origin and destination and trigger a search.

3.5 WHEN the user taps the swap icon in the search card THEN the system SHALL CONTINUE TO exchange the from/to values and their associated `Location` objects.

3.6 WHEN the user submits the search card with missing fields THEN the system SHALL CONTINUE TO display inline validation errors for each missing field without making any API call.

3.7 WHEN the user taps "Clear All" in the recent searches section THEN the system SHALL CONTINUE TO remove all history items from local state and storage.

3.8 WHEN the user selects a location suggestion from the autocomplete dropdown THEN the system SHALL CONTINUE TO populate the input field with the location name and store the full `Location` object for use as a search parameter.

3.9 WHEN the user applies sort or bus-type filters THEN the system SHALL CONTINUE TO sort and filter the in-memory results list client-side without re-fetching from the API.

3.10 WHEN the app is in mock mode (`EXPO_PUBLIC_USE_MOCK=true`) THEN the system SHALL CONTINUE TO use mock data for all API calls so that development and testing work without a live backend.
