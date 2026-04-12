import { SearchCard } from "@/components/search/search-card";
import type { Trip } from "@/lib/api";
import {
    MOCK_COMPANIES,
    MOCK_PAST_BOOKINGS,
    MOCK_POPULAR_ROUTES,
    MOCK_SEARCH_HISTORY,
    MOCK_TRIPS,
    PopularRoute,
    SearchHistoryItem,
} from "@/src/services/mock.data";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

type SortKey = "price_asc" | "price_desc" | "time" | "duration" | "rating";
type BusTypeFilter =
  | "all"
  | "Luxury Coach"
  | "Express"
  | "Standard"
  | "Mini Bus";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
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

// ─── Pre-search: last trip recap ──────────────────────────────────────────────
function LastTripBanner({ onRebook }: { onRebook: () => void }) {
  const { t } = useTranslation();
  const last = MOCK_PAST_BOOKINGS[0];
  if (!last) return null;
  return (
    <TouchableOpacity
      style={S.lastTrip}
      onPress={onRebook}
      activeOpacity={0.85}
    >
      <View style={S.lastTripLeft}>
        <View style={S.lastTripBadge}>
          <Text style={S.lastTripBadgeText}>↩ {t("search.rebook")}</Text>
        </View>
        <View style={S.lastTripRoute}>
          <Text style={S.lastTripCode}>{last.trip.from.code}</Text>
          <View style={{ flex: 1, alignItems: "center" }}>
            <View style={S.popularChipLine}>
              <View style={S.routeDot} />
              <View style={S.routeBar} />
              <Ionicons name="bus" size={12} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
          <Text style={S.lastTripCode}>{last.trip.to.code}</Text>
        </View>
        <Text style={S.lastTripCities}>
          {last.trip.from.city} → {last.trip.to.city}
        </Text>
      </View>
      <View style={S.lastTripRight}>
        <Text style={S.lastTripPrice}>
          {last.currency}
          {"\n"}
          {last.totalPaid.toLocaleString()}
        </Text>
        <View style={S.lastTripArrow}>
          <Ionicons name="arrow-forward" size={14} color="#0A4370" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Result: trip card ────────────────────────────────────────────────────────
function TripCard({
  trip,
  onBook,
  t,
}: {
  trip: Trip;
  onBook: () => void;
  t: (k: string, o?: any) => string;
}) {
  const seatsLow = trip.seatsAvailable <= 5;
  const company = MOCK_COMPANIES.find((c) => c.name === trip.operator);

  return (
    <View style={S.card}>
      <View style={S.cardHeader}>
        <View style={S.cardOperator}>
          {company && (
            <Text style={{ fontSize: 20, marginRight: 8 }}>{company.logo}</Text>
          )}
          <View>
            <Text style={S.cardOperatorName}>{trip.operator}</Text>
            <View style={S.cardRatingRow}>
              <Ionicons name="star" size={10} color="#F6AD55" />
              <Text style={S.cardRatingText}>{company?.rating ?? "—"}</Text>
              <Text style={S.cardRatingDot}>·</Text>
              <Text style={S.cardRatingText}>{trip.busType}</Text>
            </View>
          </View>
        </View>
        {seatsLow && (
          <View style={S.urgencyBadge}>
            <Ionicons name="flame" size={10} color="#E53E3E" />
            <Text style={S.urgencyText}>
              {t("trips.seatsLeft", { count: trip.seatsAvailable })}
            </Text>
          </View>
        )}
      </View>

      <View style={S.cardRoute}>
        <View style={S.cardStop}>
          <Text style={S.cardTime}>{formatTime(trip.departureTime)}</Text>
          <Text style={S.cardCode}>{trip.from.code}</Text>
          <Text style={S.cardCity} numberOfLines={1}>
            {trip.from.city}
          </Text>
        </View>
        <View style={S.cardMid}>
          <Text style={S.cardDuration}>{trip.duration}</Text>
          <View style={S.routeLine}>
            <View style={S.routeDot} />
            <View style={S.routeBar} />
            <Ionicons name="bus" size={14} color="#0A4370" />
          </View>
          <View style={S.directBadge}>
            <Text style={S.directText}>Direct</Text>
          </View>
        </View>
        <View style={[S.cardStop, { alignItems: "flex-end" }]}>
          <Text style={S.cardTime}>{formatTime(trip.arrivalTime)}</Text>
          <Text style={S.cardCode}>{trip.to.code}</Text>
          <Text style={S.cardCity} numberOfLines={1}>
            {trip.to.city}
          </Text>
        </View>
      </View>

      <View style={S.cardFooter}>
        <View>
          <Text style={S.cardPrice}>
            {trip.currency} {trip.price.toLocaleString()}
          </Text>
          <Text style={S.cardPriceSub}>{t("home.perPerson")}</Text>
        </View>
        <TouchableOpacity
          style={S.bookBtn}
          onPress={onBook}
          activeOpacity={0.85}
        >
          <Text style={S.bookBtnText}>{t("trips.bookNow")}</Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Filter sheet ─────────────────────────────────────────────────────────────
function FilterSheet({
  visible,
  onClose,
  sortKey,
  setSortKey,
  busType,
  setBusType,
  company,
  setCompany,
  t,
}: {
  visible: boolean;
  onClose: () => void;
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
  busType: BusTypeFilter;
  setBusType: (b: BusTypeFilter) => void;
  company: string | null;
  setCompany: (c: string | null) => void;
  t: (k: string) => string;
}) {
  const SORTS: {
    key: SortKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: "time", label: t("search.sortTime"), icon: "time-outline" },
    {
      key: "price_asc",
      label: t("search.sortPrice"),
      icon: "trending-down-outline",
    },
    {
      key: "price_desc",
      label: t("search.sortPriceDesc"),
      icon: "trending-up-outline",
    },
    {
      key: "duration",
      label: t("search.sortDuration"),
      icon: "hourglass-outline",
    },
    { key: "rating", label: t("search.sortRating"), icon: "star-outline" },
  ];
  const BUS_TYPES: { key: BusTypeFilter; icon: string }[] = [
    { key: "all", icon: "🚌" },
    { key: "Luxury Coach", icon: "✨" },
    { key: "Express", icon: "⚡" },
    { key: "Standard", icon: "🎫" },
    { key: "Mini Bus", icon: "🚐" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={S.modalOverlay}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={S.filterSheet}>
          <View style={S.filterHandle} />
          <View style={S.filterHeader}>
            <Text style={S.filterTitle}>{t("search.filters")}</Text>
            <TouchableOpacity onPress={onClose} style={S.filterClose}>
              <Ionicons name="close" size={18} color="#1A202C" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={S.filterSection}>{t("search.sortBy")}</Text>
            <View style={S.filterRows}>
              {SORTS.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[S.filterRow, sortKey === s.key && S.filterRowActive]}
                  onPress={() => setSortKey(s.key)}
                >
                  <View
                    style={[
                      S.filterRowIcon,
                      sortKey === s.key && S.filterRowIconActive,
                    ]}
                  >
                    <Ionicons
                      name={s.icon}
                      size={15}
                      color={sortKey === s.key ? "#fff" : "#6A717D"}
                    />
                  </View>
                  <Text
                    style={[
                      S.filterRowText,
                      sortKey === s.key && S.filterRowTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                  {sortKey === s.key && (
                    <Ionicons name="checkmark" size={16} color="#0A4370" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={S.filterSection}>{t("search.busType")}</Text>
            <View style={S.filterChips}>
              {BUS_TYPES.map((b) => (
                <TouchableOpacity
                  key={b.key}
                  style={[
                    S.filterChip,
                    busType === b.key && S.filterChipActive,
                  ]}
                  onPress={() => setBusType(b.key)}
                >
                  <Text style={{ fontSize: 14 }}>{b.icon}</Text>
                  <Text
                    style={[
                      S.filterChipText,
                      busType === b.key && S.filterChipTextActive,
                    ]}
                  >
                    {b.key === "all" ? t("search.allTypes") : b.key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={S.filterSection}>{t("search.company")}</Text>
            <View style={S.filterChips}>
              <TouchableOpacity
                style={[S.filterChip, company === null && S.filterChipActive]}
                onPress={() => setCompany(null)}
              >
                <Text
                  style={[
                    S.filterChipText,
                    company === null && S.filterChipTextActive,
                  ]}
                >
                  {t("search.allCompanies")}
                </Text>
              </TouchableOpacity>
              {MOCK_COMPANIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[S.filterChip, company === c.id && S.filterChipActive]}
                  onPress={() => setCompany(c.id)}
                >
                  <Text style={{ fontSize: 14 }}>{c.logo}</Text>
                  <Text
                    style={[
                      S.filterChipText,
                      company === c.id && S.filterChipTextActive,
                    ]}
                  >
                    {c.shortName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={S.applyBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={S.applyBtnText}>{t("search.applyFilters")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<Trip[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [busType, setBusType] = useState<BusTypeFilter>("all");
  const [company, setCompany] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistoryItem[]>(
    USE_MOCK ? MOCK_SEARCH_HISTORY : [],
  );
  const [lastSearchValues, setLastSearchValues] = useState<{
    from: string;
    to: string;
    date: string;
  } | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const activeFilterCount = [
    sortKey !== "time" ? 1 : 0,
    busType !== "all" ? 1 : 0,
    company !== null ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  function handleSearch(values: { from: string; to: string; date: string }) {
    const raw = USE_MOCK ? MOCK_TRIPS : [];
    setResults(raw);
    setSearched(true);
    setLastSearchValues(values);
    fade.setValue(0);
    slideUp.setValue(20);
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
    // Pre-fill search card — just trigger search with history values
    handleSearch({ from: item.from.name, to: item.to.name, date: item.date });
  }

  function handlePopularPress(route: PopularRoute) {
    handleSearch({ from: route.from.name, to: route.to.name, date: "" });
  }

  const filtered = useMemo(() => {
    let list = [...results];
    if (busType !== "all") list = list.filter((t) => t.busType === busType);
    if (company !== null) {
      const name = MOCK_COMPANIES.find((c) => c.id === company)?.name;
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
          const ra =
            MOCK_COMPANIES.find((c) => c.name === a.operator)?.rating ?? 0;
          const rb =
            MOCK_COMPANIES.find((c) => c.name === b.operator)?.rating ?? 0;
          return rb - ra;
        });
        break;
      }
    }
    return list;
  }, [results, busType, company, sortKey]);

  // ── Pre-search discovery state ──
  const PreSearchContent = (
    <View style={S.preSearch}>
      {/* Last trip rebook */}
      {USE_MOCK && MOCK_PAST_BOOKINGS.length > 0 && (
        <LastTripBanner
          onRebook={() =>
            handleHistoryPress({
              id: "rebook",
              from: MOCK_PAST_BOOKINGS[0].trip.from,
              to: MOCK_PAST_BOOKINGS[0].trip.to,
              date: "",
              searchedAt: "",
            })
          }
        />
      )}

      {/* Search history */}
      {history.length > 0 && (
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <View style={S.sectionHeaderLeft}>
              <Ionicons name="time-outline" size={14} color="#6A717D" />
              <Text style={S.sectionTitle}>{t("search.recentSearches")}</Text>
            </View>
            <TouchableOpacity onPress={() => setHistory([])}>
              <Text style={S.sectionAction}>{t("search.clearAll")}</Text>
            </TouchableOpacity>
          </View>
          {history.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              onPress={() => handleHistoryPress(item)}
              onRemove={() =>
                setHistory((h) => h.filter((x) => x.id !== item.id))
              }
            />
          ))}
        </View>
      )}

      {/* Popular routes */}
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
          {MOCK_POPULAR_ROUTES.map((r, i) => (
            <PopularRouteChip
              key={i}
              route={r}
              onPress={() => handlePopularPress(r)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Companies quick pick */}
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
          {MOCK_COMPANIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                S.companyChip,
                company === c.id && {
                  backgroundColor: c.color,
                  borderColor: c.color,
                },
              ]}
              onPress={() => setCompany(company === c.id ? null : c.id)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>{c.logo}</Text>
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
                  style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
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
    </View>
  );

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      {/* Header */}
      <View
        style={[S.header, { paddingTop: Platform.OS === "android" ? 48 : 60 }]}
      >
        <View style={S.headerTop}>
          <View>
            <Text style={S.headerTitle}>{t("search.title")}</Text>
            <Text style={S.headerSub}>{t("search.subtitle")}</Text>
          </View>
          <TouchableOpacity
            style={[S.filterBtn, activeFilterCount > 0 && S.filterBtnActive]}
            onPress={() => setFilterOpen(true)}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFilterCount > 0 ? "#fff" : "#0A4370"}
            />
            {activeFilterCount > 0 && (
              <View style={S.filterBadge}>
                <Text style={S.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={searched ? filtered : []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {/* Search card — overlaps header */}
            <View style={S.searchCardWrap}>
              <SearchCard onSearch={handleSearch} />
            </View>

            {/* Pre-search discovery */}
            {!searched && PreSearchContent}

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
                        setSearched(false);
                        setResults([]);
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
                      onPress={() => setSortKey(k)}
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
          searched ? (
            <View style={S.empty}>
              <Ionicons name="bus-outline" size={52} color="#CBD5E0" />
              <Text style={S.emptyTitle}>{t("search.noResults")}</Text>
              <Text style={S.emptyHint}>{t("search.noResultsHint")}</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={S.clearBtn}
                  onPress={() => {
                    setBusType("all");
                    setCompany(null);
                    setSortKey("time");
                  }}
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
        sortKey={sortKey}
        setSortKey={setSortKey}
        busType={busType}
        setBusType={setBusType}
        company={company}
        setCompany={setCompany}
        t={t}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F4F6" },

  // Header
  header: {
    backgroundColor: "#0A4370",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  filterBtnActive: {
    backgroundColor: "#0A4370",
    borderWidth: 2,
    borderColor: "#fff",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },

  searchCardWrap: { margin: 16, marginTop: -16 },
  listContent: { paddingBottom: 140 },

  // Pre-search
  preSearch: { paddingBottom: 8 },
  section: { marginHorizontal: 16, marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#1A202C" },
  sectionAction: { fontSize: 12, fontWeight: "600", color: "#0A4370" },

  // History row
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  historyIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  historyMid: { flex: 1 },
  historyRoute: { flexDirection: "row", alignItems: "center", gap: 6 },
  historyCity: { fontSize: 14, fontWeight: "700", color: "#1A202C" },
  historyDate: { fontSize: 11, color: "#A0A8B4", marginTop: 2 },
  historyRemove: { padding: 4 },

  // Popular route chip
  popularChip: {
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  popularChipRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  popularChipCode: { fontSize: 14, fontWeight: "900", color: "#1A202C" },
  popularChipLine: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  popularChipCities: { fontSize: 10, color: "#6A717D", marginBottom: 8 },
  popularChipFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  popularChipPrice: { fontSize: 12, fontWeight: "800", color: "#0A4370" },
  popularChipMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  popularChipMetaText: { fontSize: 10, color: "#6A717D" },

  // Last trip banner
  lastTrip: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#0A4370",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  lastTripLeft: { flex: 1 },
  lastTripBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  lastTripBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff" },
  lastTripRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  lastTripCode: { fontSize: 18, fontWeight: "900", color: "#fff" },
  lastTripCities: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  lastTripRight: { alignItems: "center", gap: 8 },
  lastTripPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 16,
  },
  lastTripArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  // Company chip
  companyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  companyChipName: { fontSize: 12, fontWeight: "700", color: "#1A202C" },
  companyChipRating: { fontSize: 10, color: "#6A717D" },

  // Results bar
  resultsBar: { marginHorizontal: 16, marginBottom: 12 },
  resultsBarTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  resultsText: { fontSize: 14, fontWeight: "800", color: "#1A202C" },
  modifyBtn: {
    backgroundColor: "#EEF4FF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modifyBtnText: { fontSize: 11, fontWeight: "700", color: "#0A4370" },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sortPillActive: { backgroundColor: "#0A4370", borderColor: "#0A4370" },
  sortPillText: { fontSize: 11, fontWeight: "600", color: "#6A717D" },
  sortPillTextActive: { color: "#fff" },

  // Trip card
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardOperator: { flexDirection: "row", alignItems: "center" },
  cardOperatorName: { fontSize: 14, fontWeight: "800", color: "#1A202C" },
  cardRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  cardRatingText: { fontSize: 11, color: "#6A717D", fontWeight: "600" },
  cardRatingDot: { fontSize: 11, color: "#C8CDD6" },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF5F5",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urgencyText: { fontSize: 10, fontWeight: "700", color: "#E53E3E" },
  cardRoute: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardStop: { width: 68 },
  cardTime: { fontSize: 20, fontWeight: "900", color: "#1A202C" },
  cardCode: { fontSize: 11, fontWeight: "700", color: "#6A717D", marginTop: 2 },
  cardCity: { fontSize: 10, color: "#A0A8B4", marginTop: 1 },
  cardMid: { flex: 1, alignItems: "center", gap: 4 },
  cardDuration: { fontSize: 11, fontWeight: "700", color: "#6A717D" },
  directBadge: {
    backgroundColor: "#F0FFF4",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  directText: { fontSize: 9, fontWeight: "700", color: "#38A169" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  cardPrice: { fontSize: 20, fontWeight: "900", color: "#0A4370" },
  cardPriceSub: { fontSize: 10, color: "#A0A8B4", marginTop: 1 },
  cardSeats: { fontSize: 10, fontWeight: "600" },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0A4370",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bookBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },

  routeLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 2,
  },
  routeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0A4370",
  },
  routeBar: { flex: 1, height: 1.5, backgroundColor: "#CBD5E0" },

  // Empty
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1A202C" },
  emptyHint: { fontSize: 13, color: "#6A717D", textAlign: "center" },
  clearBtn: {
    marginTop: 8,
    backgroundColor: "#0A4370",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Filter modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  filterSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    maxHeight: "85%",
  },
  filterHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  filterTitle: { fontSize: 20, fontWeight: "900", color: "#1A202C" },
  filterClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  filterSection: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6A717D",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 20,
  },
  filterRows: { gap: 6 },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8F9FB",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  filterRowActive: { backgroundColor: "#EEF4FF", borderColor: "#0A4370" },
  filterRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  filterRowIconActive: { backgroundColor: "#0A4370" },
  filterRowText: { flex: 1, fontSize: 13, fontWeight: "600", color: "#6A717D" },
  filterRowTextActive: { color: "#0A4370", fontWeight: "700" },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8F9FB",
  },
  filterChipActive: { backgroundColor: "#0A4370", borderColor: "#0A4370" },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#6A717D" },
  filterChipTextActive: { color: "#fff" },
  applyBtn: {
    backgroundColor: "#0A4370",
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  applyBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
