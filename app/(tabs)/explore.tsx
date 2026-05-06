import { ExampleTripCard } from "@/components/search/example-trip-card";
import {
  FilterSheet,
  FilterValues,
  defaultFilters,
} from "@/components/search/filter-sheet";
import { SearchCard } from "@/components/search/search-card";
import { TripCard } from "@/components/search/trip-card";
import { TripCardSkeleton } from "@/components/search/trip-card-skeleton";
import { useCompanies } from "@/hooks/use-companies";
import { usePopularRoutes } from "@/hooks/use-popular-routes";
import { useSearchHistory } from "@/hooks/use-search-history";
import { useTrips } from "@/hooks/use-trips";
import type { PopularRoute, SearchHistoryItem } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type SortKey = "price_asc" | "price_desc" | "time" | "duration" | "rating";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

// ─── Pre-search: history item ─────────────────────────────────────────────────
function HistoryRow({
  item,
  onPress,
  onRemove,
}: {
  item: SearchHistoryItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <TouchableOpacity
      style={S.historyRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={S.historyIcon}>
        <Ionicons name="time-outline" size={16} color="#6A717D" />
      </View>
      <View style={S.historyMid}>
        <View style={S.historyRoute}>
          <Text style={S.historyCity}>{item.from.city}</Text>
          <Ionicons name="arrow-forward" size={12} color="#A0A8B4" />
          <Text style={S.historyCity}>{item.to.city}</Text>
        </View>
        <Text style={S.historyDate}>{formatDate(item.date)}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} hitSlop={10} style={S.historyRemove}>
        <Ionicons name="close" size={14} color="#C8CDD6" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Pre-search: popular route card ──────────────────────────────────────────
function PopularRouteChip({
  route,
  onPress,
}: {
  route: PopularRoute;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={S.popularChip}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={S.popularChipRoute}>
        <Text style={S.popularChipCode}>{route.from.code}</Text>
        <View style={S.popularChipLine}>
          <View style={S.routeDot} />
          <View style={S.routeBar} />
          <Ionicons name="bus" size={11} color="#0A4370" />
        </View>
        <Text style={S.popularChipCode}>{route.to.code}</Text>
      </View>
      <Text style={S.popularChipCities} numberOfLines={1}>
        {route.from.city} → {route.to.city}
      </Text>
      <View style={S.popularChipFooter}>
        <Text style={S.popularChipPrice}>
          {route.currency} {route.minPrice.toLocaleString()}+
        </Text>
        <View style={S.popularChipMeta}>
          <Ionicons name="bus-outline" size={9} color="#6A717D" />
          <Text style={S.popularChipMetaText}>{route.tripsPerDay}/day</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { companies } = useCompanies();
  const { routes: popularRoutes } = usePopularRoutes();
  const {
    history,
    save: saveHistory,
    remove: removeHistory,
    clear: clearHistory,
  } = useSearchHistory();
  const {
    trips: searchResults,
    search: searchTrips,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    retry,
    reset,
  } = useTrips();

  const [searched, setSearched] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterValues>(defaultFilters);
  const fade = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const { sortKey, companyId: company } = appliedFilters;

  const activeFilterCount = [
    sortKey !== "time" ? 1 : 0,
    company !== null ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  async function handleSearch(values: {
    from: string;
    to: string;
    date: string;
    fromLocation?: any;
    toLocation?: any;
    timeFrom?: string;
    timeTo?: string;
  }) {
    setSearched(true);
    fade.setValue(0);
    slideUp.setValue(20);
    await searchTrips({
      from: values.from,
      to: values.to,
      date: values.date,
      operatorId: appliedFilters.companyId ?? undefined,
      timeFrom: values.timeFrom,
      timeTo: values.timeTo,
    });
    if (values.from && values.to) {
      saveHistory({
        from: values.fromLocation ?? {
          id: "",
          name: values.from,
          city: values.from,
          code: "",
        },
        to: values.toLocation ?? {
          id: "",
          name: values.to,
          city: values.to,
          code: "",
        },
        date: values.date,
      });
    }
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        useNativeDriver: true,
        speed: 16,
        bounciness: 4,
      }),
    ]).start();
  }

  function handleHistoryPress(item: SearchHistoryItem) {
    handleSearch({
      from: item.from.name,
      to: item.to.name,
      date: item.date,
      fromLocation: item.from,
      toLocation: item.to,
    });
  }

  function handlePopularPress(route: PopularRoute) {
    handleSearch({
      from: route.from.name,
      to: route.to.name,
      date: "",
      fromLocation: route.from,
      toLocation: route.to,
    });
  }

  const filtered = useMemo(() => {
    let list = [...searchResults];
    if (company !== null) {
      const name = companies.find((c) => c.id === company)?.name;
      if (name) list = list.filter((t) => t.operator === name);
    }
    switch (sortKey) {
      case "price_asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "time":
        list.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
        break;
      case "duration":
        list.sort((a, b) => a.duration.localeCompare(b.duration));
        break;
      case "rating": {
        list.sort((a, b) => {
          const ra = companies.find((c) => c.name === a.operator)?.rating ?? 0;
          const rb = companies.find((c) => c.name === b.operator)?.rating ?? 0;
          return rb - ra;
        });
        break;
      }
    }
    return list;
  }, [searchResults, company, sortKey, companies]);

  // ── Pre-search discovery state ──
  const PreSearchContent = (
    <View style={S.preSearch}>
      {/* Search history */}
      {history.length > 0 && (
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <View style={S.sectionHeaderLeft}>
              <Ionicons name="time-outline" size={14} color="#6A717D" />
              <Text style={S.sectionTitle}>{t("search.recentSearches")}</Text>
            </View>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={S.sectionAction}>{t("search.clearAll")}</Text>
            </TouchableOpacity>
          </View>
          {history.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              onPress={() => handleHistoryPress(item)}
              onRemove={() => removeHistory(item.id)}
            />
          ))}
        </View>
      )}

      {/* Popular routes */}
      {popularRoutes.length > 0 && (
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <View style={S.sectionHeaderLeft}>
              <Ionicons name="trending-up-outline" size={14} color="#6A717D" />
              <Text style={S.sectionTitle}>{t("home.popularRoutes")}</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 4 }}
          >
            {popularRoutes.map((r, i) => (
              <PopularRouteChip
                key={i}
                route={r}
                onPress={() => handlePopularPress(r)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Companies quick pick */}
      {companies.length > 0 && (
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <View style={S.sectionHeaderLeft}>
              <Ionicons name="business-outline" size={14} color="#6A717D" />
              <Text style={S.sectionTitle}>{t("home.featuredCompanies")}</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          >
            {companies.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  S.companyChip,
                  company === c.id && {
                    backgroundColor: c.color,
                    borderColor: c.color,
                  },
                ]}
                onPress={() =>
                  setAppliedFilters((f) => ({
                    ...f,
                    companyId: company === c.id ? null : c.id,
                  }))
                }
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16 }}>{c.logoUrl}</Text>
                <View>
                  <Text
                    style={[
                      S.companyChipName,
                      company === c.id && { color: "#fff" },
                    ]}
                  >
                    {c.shortName}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Ionicons
                      name="star"
                      size={9}
                      color={
                        company === c.id ? "rgba(255,255,255,0.8)" : "#F6AD55"
                      }
                    />
                    <Text
                      style={[
                        S.companyChipRating,
                        company === c.id && { color: "rgba(255,255,255,0.85)" },
                      ]}
                    >
                      {c.rating}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Example trip card */}
      <ExampleTripCard />
    </View>
  );

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      {/* ── Unified header: title + filter + search card ── */}
      <View style={S.header}>
        {/* Title row */}
        <View style={S.headerTop}>
          <View style={S.headerText}>
            <Text style={S.headerTitle}>{t("search.title")}</Text>
            <Text style={S.headerSubtitle}>{t("search.subtitle")}</Text>
          </View>
          <TouchableOpacity
            style={[S.filterBtn, activeFilterCount > 0 && S.filterBtnActive]}
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={20} color="#fff" />
            {activeFilterCount > 0 && (
              <View style={S.filterBadge}>
                <Text style={S.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search card sits inside the header */}
      </View>
      <SearchCard onSearch={handleSearch} />
      <FlatList
        data={searched ? filtered : []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.listContent}
        keyboardShouldPersistTaps="handled"
        onEndReached={() => {
          if (hasMore && !loadingMore) loadMore();
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator color="#0A4370" />
            </View>
          ) : searched && !hasMore && searchResults.length > 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#A0A8B4" }}>
                {t("search.noMoreTrips")}
              </Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View>
            {/* Pre-search discovery */}
            {!searched && PreSearchContent}

            {/* Skeleton loading */}
            {loading && searchResults.length === 0 && <TripCardSkeleton />}

            {/* Error banner */}
            {error && (
              <View style={S.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#E53E3E"
                />
                <Text style={S.errorBannerText}>{error}</Text>
                <TouchableOpacity onPress={retry} style={S.retryBtn}>
                  <Text style={S.retryBtnText}>
                    {t("search.retry", "Retry")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Results bar */}
            {searched && (
              <Animated.View
                style={[
                  S.resultsBar,
                  { opacity: fade, transform: [{ translateY: slideUp }] },
                ]}
              >
                <View style={S.resultsBarTop}>
                  <Text style={S.resultsText}>
                    {t("search.results", { count: filtered.length })}
                  </Text>
                  {searched && (
                    <TouchableOpacity
                      onPress={() => {
                        reset();
                        setSearched(false);
                      }}
                      style={S.modifyBtn}
                    >
                      <Text style={S.modifyBtnText}>
                        {t("trips.modifySearch")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {(
                    ["time", "price_asc", "duration", "rating"] as SortKey[]
                  ).map((k) => (
                    <TouchableOpacity
                      key={k}
                      style={[S.sortPill, sortKey === k && S.sortPillActive]}
                      onPress={() =>
                        setAppliedFilters((f) => ({ ...f, sortKey: k }))
                      }
                    >
                      <Text
                        style={[
                          S.sortPillText,
                          sortKey === k && S.sortPillTextActive,
                        ]}
                      >
                        {k === "time"
                          ? t("search.sortTime")
                          : k === "price_asc"
                            ? t("search.sortPrice")
                            : k === "duration"
                              ? t("search.sortDuration")
                              : t("search.sortRating")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Animated.View
            style={{ opacity: fade, transform: [{ translateY: slideUp }] }}
          >
            <TripCard
              trip={item}
              company={companies.find((c) => c.name === item.operator)}
              onBook={() =>
                router.push({
                  pathname: "/booking" as never,
                  params: { trip: JSON.stringify(item) },
                })
              }
              t={t}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          searched && !loading ? (
            <View style={S.empty}>
              <Ionicons name="bus-outline" size={52} color="#CBD5E0" />
              <Text style={S.emptyTitle}>{t("search.noResults")}</Text>
              <Text style={S.emptyHint}>{t("search.noResultsHint")}</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={S.clearBtn}
                  onPress={() => setAppliedFilters(defaultFilters)}
                >
                  <Text style={S.clearBtnText}>{t("search.clearFilters")}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(filters) => setAppliedFilters(filters)}
        applied={appliedFilters}
        companies={companies}
        t={t}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F9FC" },

  // Unified header with gradient effect
  header: {
    backgroundColor: "#0A4370",
    paddingTop: Platform.OS === "android" ? 48 : 56,
    paddingHorizontal: 18,
    paddingBottom: 20,
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  filterBtnActive: {
    backgroundColor: "rgba(255,255,255,0.28)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  filterBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0A4370",
    shadowColor: "#E53E3E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  filterBadgeText: { fontSize: 10, fontWeight: "900", color: "#fff" },

  listContent: { paddingBottom: 140 },

  // Pre-search
  preSearch: { paddingBottom: 12 },
  section: { marginHorizontal: 18, marginTop: 28 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A202C",
    letterSpacing: -0.2,
  },
  sectionAction: { fontSize: 13, fontWeight: "700", color: "#0A4370" },

  // History row
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E8EDF5",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  historyMid: { flex: 1 },
  historyRoute: { flexDirection: "row", alignItems: "center", gap: 7 },
  historyCity: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A202C",
    letterSpacing: -0.2,
  },
  historyDate: {
    fontSize: 12,
    color: "#6A717D",
    marginTop: 3,
    fontWeight: "500",
  },
  historyRemove: { padding: 6 },

  // Popular route chip
  popularChip: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E8EDF5",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  popularChipRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  popularChipCode: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1A202C",
    letterSpacing: -0.3,
  },
  popularChipLine: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  popularChipCities: {
    fontSize: 11,
    color: "#6A717D",
    marginBottom: 10,
    fontWeight: "500",
  },
  popularChipFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  popularChipPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0A4370",
    letterSpacing: -0.2,
  },
  popularChipMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  popularChipMetaText: { fontSize: 10, color: "#6A717D", fontWeight: "600" },

  // Company chip
  companyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#E8EDF5",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  companyChipName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A202C",
    letterSpacing: -0.1,
  },
  companyChipRating: { fontSize: 11, color: "#6A717D", fontWeight: "600" },

  // Results bar
  resultsBar: { marginHorizontal: 18, marginBottom: 14, marginTop: 8 },
  resultsBarTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1A202C",
    letterSpacing: -0.3,
  },
  modifyBtn: {
    backgroundColor: "#EEF4FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  modifyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0A4370",
    letterSpacing: 0.2,
  },
  sortPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E8EDF5",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sortPillActive: {
    backgroundColor: "#0A4370",
    borderColor: "#0A4370",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  sortPillText: { fontSize: 12, fontWeight: "600", color: "#6A717D" },
  sortPillTextActive: { color: "#fff", fontWeight: "700" },

  // Route line decorators
  routeLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 3,
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0A4370",
  },
  routeBar: { flex: 1, height: 2, backgroundColor: "#CBD5E0" },

  // Empty state
  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A202C",
    letterSpacing: -0.3,
  },
  emptyHint: {
    fontSize: 14,
    color: "#6A717D",
    textAlign: "center",
    lineHeight: 20,
  },
  clearBtn: {
    marginTop: 12,
    backgroundColor: "#0A4370",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 18,
    marginBottom: 14,
    backgroundColor: "#FFF5F5",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#FED7D7",
    shadowColor: "#E53E3E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#C53030",
    fontWeight: "600",
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: "#E53E3E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#E53E3E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
});
