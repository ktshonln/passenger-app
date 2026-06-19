import { useCompanies } from "@/hooks/use-companies";
import { useLocations } from "@/hooks/use-locations";
import { usePopularRoutes } from "@/hooks/use-popular-routes";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useTrips } from "@/hooks/use-trips";
import type { Company, PopularRoute, Recommendation, Trip } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Modal,
  Platform,
  Image as RNImage,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function greeting(name: string | undefined, t: (k: string) => string) {
  const h = new Date().getHours();
  const time =
    h < 12
      ? t("home.goodMorning")
      : h < 17
        ? t("home.goodAfternoon")
        : t("home.goodEvening");
  return name ? `${time}, ${name} 👋` : time;
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  onViewAll,
}: {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={S.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={S.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={S.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll}>
          <Text style={S.viewAll}>{t("common.viewAll", "View all")} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Search suggestions modal ─────────────────────────────────────────────────
function UniversalSearch({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (text: string) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  const [detailRoute, setDetailRoute] = useState<PopularRoute | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { results: locationResults, loading: locationsLoading } =
    useLocations(query);
  const { companies } = useCompanies();
  const { routes: popularRoutes } = usePopularRoutes();
  const {
    trips: liveTrips,
    search: searchLiveTrips,
    loading: tripsLoading,
  } = useTrips();

  const loading = locationsLoading || tripsLoading;

  // Search live trips when query changes
  useEffect(() => {
    if (query.length > 2) {
      const timer = setTimeout(() => {
        // Search trips matching the query as either origin or destination
        searchLiveTrips({
          from: query,
          to: "",
          date: new Date().toISOString().split("T")[0],
          limit: 5,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [query, searchLiveTrips]);

  const showModal = focused && query.length > 0;
  const q = query.toLowerCase();

  // Match companies
  const matchingCompanies =
    query.length > 0
      ? companies.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.shortName.toLowerCase().includes(q),
        )
      : [];

  // Match routes — any route where from OR to city/name contains query
  const matchingRoutes =
    query.length > 0
      ? popularRoutes.filter(
          (r) =>
            r.from.city.toLowerCase().includes(q) ||
            r.to.city.toLowerCase().includes(q) ||
            r.from.name.toLowerCase().includes(q) ||
            r.to.name.toLowerCase().includes(q) ||
            r.from.code.toLowerCase().includes(q) ||
            r.to.code.toLowerCase().includes(q),
        )
      : [];

  const totalResults =
    locationResults.length +
    matchingRoutes.length +
    matchingCompanies.length +
    liveTrips.length;

  const handleClose = useCallback(() => {
    setFocused(false);
    onQueryChange("");
    inputRef.current?.blur();
  }, [onQueryChange]);

  const handleSelectTrip = useCallback(
    (trip: Trip) => {
      handleClose();
      router.push({
        pathname: "/trip-detail" as never,
        params: { tripId: trip.id },
      });
    },
    [handleClose, router],
  );

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      handleClose();
      router.push({
        pathname: "/search-results" as never,
        params: { q: query },
      });
    }
  }, [query, handleClose, router]);

  const handleSelectLocation = useCallback(
    (item: any) => {
      handleClose();
      router.push({
        pathname: "/search-results" as never,
        params: { from: item.name, fromId: item.id },
      });
    },
    [handleClose, router],
  );

  const handleSelectCompany = useCallback(
    (company: any) => {
      handleClose();
      router.push({
        pathname: "/search-results" as never,
        params: { company: company.id },
      });
    },
    [handleClose, router],
  );

  return (
    <>
      {/* ── Search bar ── */}
      <View style={S.quickSearch}>
        <Ionicons name="search-outline" size={16} color="#6A717D" />
        <TextInput
          ref={inputRef}
          style={S.quickSearchInput}
          placeholder={t(
            "home.searchPlaceholder",
            "Search destinations, routes, companies...",
          )}
          placeholderTextColor="#A0A8B4"
          value={query}
          onChangeText={onQueryChange}
          onFocus={() => setFocused(true)}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {loading ? (
          <View style={S.quickSearchBtn}>
            <Ionicons name="hourglass-outline" size={14} color="#fff" />
          </View>
        ) : (
          <TouchableOpacity style={S.quickSearchBtn} onPress={handleSearch}>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Full-screen modal — 30% from top ── */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        {/* Blurred backdrop — tappable to close */}
        <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </BlurView>

        {/* Panel — starts at 30% from top, fills rest of screen */}
        <View style={S.searchPanel}>
          {/* ── Search input row ── */}
          <View style={S.searchPanelInputRow}>
            <View style={S.searchPanelInput}>
              <Ionicons name="search-outline" size={18} color="#0A4370" />
              <TextInput
                style={S.searchPanelInputText}
                placeholder={t(
                  "home.searchPlaceholder",
                  "Search destinations, routes...",
                )}
                placeholderTextColor="#A0A8B4"
                value={query}
                onChangeText={onQueryChange}
                autoFocus
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {loading && (
                <Ionicons name="hourglass-outline" size={16} color="#A0A8B4" />
              )}
            </View>
            <TouchableOpacity style={S.searchPanelClose} onPress={handleClose}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Results count ── */}
          {totalResults > 0 && (
            <View style={S.searchPanelMeta}>
              <Text style={S.searchPanelMetaText}>
                {t("search.results", { count: totalResults })}{" "}
                {t("common.for", "for")} &quot;
                {query}&quot;
              </Text>
              <TouchableOpacity onPress={handleSearch}>
                <Text style={S.searchPanelSeeAll}>
                  {t("search.seeAll", "See all trips →")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Results list ── */}
          <ScrollView
            style={S.searchPanelScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* ── Live Trips ── */}
            {liveTrips.length > 0 && (
              <View style={S.searchSection}>
                <View style={S.searchSectionHeader}>
                  <View
                    style={[
                      S.searchSectionIcon,
                      { backgroundColor: "#FFF5F5" },
                    ]}
                  >
                    <Ionicons name="flash" size={14} color="#E53E3E" />
                  </View>
                  <Text style={S.searchSectionTitle}>
                    {t("search.liveTrips", "Live Trips")}
                  </Text>
                  <Text style={S.searchSectionCount}>{liveTrips.length}</Text>
                </View>
                {liveTrips.map((trip) => (
                  <TouchableOpacity
                    key={trip.id}
                    style={S.tripRow}
                    onPress={() => handleSelectTrip(trip)}
                    activeOpacity={0.7}
                  >
                    <View style={S.tripRowLeft}>
                      <View style={S.tripRowTimeBox}>
                        <Text style={S.tripRowTime}>
                          {new Date(trip.departure_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.tripRowRoute}>
                          {trip.origin.city ?? trip.origin.name} →{" "}
                          {trip.destination.city ?? trip.destination.name}
                        </Text>
                        <Text style={S.tripRowOperator}>
                          {trip.company.name} • {trip.bus?.type ?? "Bus"}
                        </Text>
                      </View>
                    </View>
                    <View style={S.tripRowRight}>
                      <Text style={S.tripRowPrice}>
                        {trip.currency} {trip.price?.toLocaleString() ?? "—"}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#CBD5E0"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── Locations ── */}
            {locationResults.length > 0 && (
              <View style={S.searchSection}>
                <View style={S.searchSectionHeader}>
                  <View
                    style={[
                      S.searchSectionIcon,
                      { backgroundColor: "#EEF4FF" },
                    ]}
                  >
                    <Ionicons name="location" size={14} color="#0A4370" />
                  </View>
                  <Text style={S.searchSectionTitle}>
                    {t("search.locations", "Locations")}
                  </Text>
                  <Text style={S.searchSectionCount}>
                    {locationResults.length}
                  </Text>
                </View>
                {locationResults.slice(0, 5).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={S.locationRow}
                    onPress={() => handleSelectLocation(item)}
                    activeOpacity={0.7}
                  >
                    <View style={S.locationRowLeft}>
                      <View>
                        <Text style={S.locationRowName}>{item.name}</Text>
                        <Text style={S.locationRowCity}>{item.city ?? ""}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#CBD5E0"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── Routes — full detail cards ── */}
            {matchingRoutes.length > 0 && (
              <View style={S.searchSection}>
                <View style={S.searchSectionHeader}>
                  <View
                    style={[
                      S.searchSectionIcon,
                      { backgroundColor: "#F0FFF4" },
                    ]}
                  >
                    <Ionicons name="bus" size={14} color="#38A169" />
                  </View>
                  <Text style={S.searchSectionTitle}>
                    {t("search.routes", "Available Routes")}
                  </Text>
                  <Text style={S.searchSectionCount}>
                    {matchingRoutes.length}
                  </Text>
                </View>
                {matchingRoutes.map((route, i) => (
                  <TouchableOpacity
                    key={i}
                    style={S.routeCard2}
                    onPress={() => setDetailRoute(route)}
                    activeOpacity={0.85}
                  >
                    {/* Header row */}
                    <View style={S.routeCard2Header}>
                      <View style={S.routeCard2Badge}>
                        <Ionicons
                          name="bus-outline"
                          size={10}
                          color="#0A4370"
                        />
                        <Text style={S.routeCard2BadgeText}>
                          {route.tripsPerDay} {t("home.trips", "trips")}/day
                        </Text>
                      </View>
                      <View style={S.routeCard2PriceBadge}>
                        <Text style={S.routeCard2PriceFrom}>
                          {t("home.from", "from")}{" "}
                        </Text>
                        <Text style={S.routeCard2Price}>
                          {route.currency} {route.minPrice.toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    {/* Route visual */}
                    <View style={S.routeCard2Row}>
                      <View style={S.routeCard2City}>
                        <Text style={S.routeCard2Code}>{route.from.code}</Text>
                        <Text style={S.routeCard2CityName} numberOfLines={2}>
                          {route.from.city}
                        </Text>
                        <Text style={S.routeCard2StopName} numberOfLines={1}>
                          {route.from.name}
                        </Text>
                      </View>
                      <View style={S.routeCard2Mid}>
                        <Text style={S.routeCard2Duration}>
                          {route.duration}
                        </Text>
                        <View style={S.routeCard2Line}>
                          <View style={S.routeCard2Dot} />
                          <View style={S.routeCard2Bar} />
                          <View
                            style={[
                              S.routeCard2Dot,
                              { backgroundColor: "#38A169" },
                            ]}
                          />
                        </View>
                        {route.stops && route.stops.length > 2 ? (
                          <Text style={S.routeCard2Direct}>
                            {route.stops.length - 2}{" "}
                            {t("search.stops", "stops")}
                          </Text>
                        ) : (
                          <Text style={S.routeCard2Direct}>
                            {t("search.exampleDirect", "Direct")}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[S.routeCard2City, { alignItems: "flex-end" }]}
                      >
                        <Text style={S.routeCard2Code}>{route.to.code}</Text>
                        <Text style={S.routeCard2CityName} numberOfLines={2}>
                          {route.to.city}
                        </Text>
                        <Text style={S.routeCard2StopName} numberOfLines={1}>
                          {route.to.name}
                        </Text>
                      </View>
                    </View>

                    {/* Footer */}
                    <View style={S.routeCard2Footer}>
                      <View style={S.routeCard2FooterLeft}>
                        <Ionicons
                          name="map-outline"
                          size={12}
                          color="#0A4370"
                        />
                        <Text
                          style={[
                            S.routeCard2FooterText,
                            { color: "#0A4370", fontWeight: "700" },
                          ]}
                        >
                          {t(
                            "search.chooseStops",
                            "Choose middle stops & boarding",
                          )}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#0A4370"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── Companies ── */}
            {matchingCompanies.length > 0 && (
              <View style={S.searchSection}>
                <View style={S.searchSectionHeader}>
                  <View
                    style={[
                      S.searchSectionIcon,
                      { backgroundColor: "#FAF5FF" },
                    ]}
                  >
                    <Ionicons name="business" size={14} color="#805AD5" />
                  </View>
                  <Text style={S.searchSectionTitle}>
                    {t("search.companies", "Bus Companies")}
                  </Text>
                  <Text style={S.searchSectionCount}>
                    {matchingCompanies.length}
                  </Text>
                </View>
                {matchingCompanies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={S.companyRow}
                    onPress={() => handleSelectCompany(company)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        S.companyRowLogo,
                        { backgroundColor: company.color + "18" },
                      ]}
                    >
                      {company.logoUrl &&
                      typeof company.logoUrl === "string" &&
                      (company.logoUrl.startsWith("http") ||
                        company.logoUrl.startsWith("/")) ? (
                        <RNImage
                          source={{
                            uri: company.logoUrl.startsWith("/")
                              ? API_BASE_URL + company.logoUrl
                              : company.logoUrl,
                          }}
                          style={{ width: 36, height: 36 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={{ fontSize: 22 }}>🚗</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.companyRowName}>{company.name}</Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 2,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Ionicons name="star" size={11} color="#F6AD55" />
                          <Text style={S.companyRowMeta}>{company.rating}</Text>
                        </View>
                        <Text style={S.companyRowDot}>·</Text>
                        <Text style={S.companyRowMeta}>
                          {company.totalTripsPerDay} {t("home.trips", "trips")}
                          /day
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#CBD5E0"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── No results ── */}
            {!loading && totalResults === 0 && (
              <View style={S.searchEmpty}>
                <View style={S.searchEmptyIcon}>
                  <Ionicons name="search-outline" size={32} color="#A0A8B4" />
                </View>
                <Text style={S.searchEmptyTitle}>
                  {t("search.noResults", "No results for")} &quot;{query}&quot;
                </Text>
                <Text style={S.searchEmptyDesc}>
                  {t(
                    "search.noResultsHint",
                    "Try searching for a city name, route, or bus company",
                  )}
                </Text>
                <TouchableOpacity
                  style={S.searchEmptyBtn}
                  onPress={handleSearch}
                >
                  <Text style={S.searchEmptyBtnText}>
                    {t("search.searchAllAnyway", "Search all trips anyway")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Loading ── */}
            {loading && (
              <View style={S.searchEmpty}>
                <Ionicons name="hourglass-outline" size={28} color="#A0A8B4" />
                <Text style={S.searchEmptyDesc}>
                  {t("common.loading", "Searching...")}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Route detail modal ── */}
      <RouteDetailModal
        route={detailRoute}
        visible={detailRoute !== null}
        onClose={() => setDetailRoute(null)}
      />
    </>
  );
}
function RouteDetailModal({
  route,
  visible,
  onClose,
}: {
  route: PopularRoute | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  // step: "boarding" = picking boarding stop, "alighting" = picking alighting stop
  const [step, setStep] = useState<"boarding" | "alighting">("boarding");
  const [boardingIdx, setBoardingIdx] = useState(0);
  const [alightingIdx, setAlightingIdx] = useState(1);

  useEffect(() => {
    if (visible) {
      setStep("boarding");
      setBoardingIdx(0);
      const len = route?.stops?.length ?? 2;
      setAlightingIdx(len - 1);
    }
  }, [visible, route]);

  if (!route) return null;

  const stops =
    route.stops && route.stops.length >= 2
      ? route.stops
      : [
          {
            id: route.from.id,
            name: route.from.name,
            city: route.from.city,
            code: route.from.code,
            timeFromOrigin: "0 min",
            distanceFromOrigin: "0 km",
            priceFromOrigin: 0,
          },
          {
            id: route.to.id,
            name: route.to.name,
            city: route.to.city,
            code: route.to.code,
            timeFromOrigin: route.duration,
            distanceFromOrigin: "",
            priceFromOrigin: route.minPrice,
          },
        ];

  const safeBoarding = Math.max(0, Math.min(boardingIdx, stops.length - 2));
  const safeAlighting = Math.max(
    safeBoarding + 1,
    Math.min(alightingIdx, stops.length - 1),
  );

  const boarding = stops[safeBoarding];
  const alighting = stops[safeAlighting];

  const boardingPrice = boarding?.priceFromOrigin ?? 0;
  const alightingPrice = alighting?.priceFromOrigin ?? route.minPrice;
  const price = Math.max(0, alightingPrice - boardingPrice);

  const handleStopTap = (idx: number) => {
    if (step === "boarding") {
      // Can pick any stop except the last one as boarding
      if (idx >= stops.length - 1) return;
      setBoardingIdx(idx);
      setAlightingIdx(stops.length - 1); // reset alighting to last
      setStep("alighting");
    } else {
      // Alighting must be after boarding
      if (idx <= safeBoarding) return;
      setAlightingIdx(idx);
    }
  };

  const handleSearch = () => {
    onClose();
    router.push({
      pathname: "/search-results" as never,
      params: {
        from: boarding.name,
        to: alighting.name,
        fromId: boarding.id,
        toId: alighting.id,
      },
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
      </TouchableOpacity>

      <View style={S.rdSheet}>
        {/* Handle */}
        <View style={S.rdHandle} />

        {/* Header */}
        <View style={S.rdHeader}>
          <View style={{ flex: 1 }}>
            <Text style={S.rdHeaderTitle}>
              {route.from.city} → {route.to.city}
            </Text>
            <Text style={S.rdHeaderSub}>
              {route.tripsPerDay} {t("search.tripsPerDay", "trips/day")} ·{" "}
              {route.duration} · {t("home.from", "from")} {route.currency}{" "}
              {route.minPrice.toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity style={S.rdCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color="#1A202C" />
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <View style={S.rdStepBar}>
          {/* Step 1 */}
          <View style={S.rdStepItem}>
            <View
              style={[
                S.rdStepCircle,
                step === "boarding" ? S.rdStepCircleActive : S.rdStepCircleDone,
              ]}
            >
              {step === "alighting" ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={S.rdStepNum}>1</Text>
              )}
            </View>
            <Text
              style={[
                S.rdStepLabel,
                step === "boarding" && { color: "#0A4370", fontWeight: "800" },
              ]}
            >
              {t("search.pickBoarding", "Pick boarding")}
            </Text>
          </View>
          <View style={S.rdStepConnector} />
          {/* Step 2 */}
          <View style={S.rdStepItem}>
            <View
              style={[
                S.rdStepCircle,
                step === "alighting"
                  ? S.rdStepCircleGreen
                  : S.rdStepCircleInactive,
              ]}
            >
              <Text
                style={[
                  S.rdStepNum,
                  step !== "alighting" && { color: "#A0A8B4" },
                ]}
              >
                2
              </Text>
            </View>
            <Text
              style={[
                S.rdStepLabel,
                step === "alighting" && { color: "#38A169", fontWeight: "800" },
              ]}
            >
              {t("search.pickAlighting", "Pick alighting")}
            </Text>
          </View>
        </View>

        {/* Current step instruction */}
        <View
          style={[
            S.rdInstruction,
            { backgroundColor: step === "boarding" ? "#EEF4FF" : "#F0FFF4" },
          ]}
        >
          <Ionicons
            name={step === "boarding" ? "person-outline" : "flag-outline"}
            size={16}
            color={step === "boarding" ? "#0A4370" : "#38A169"}
          />
          <Text style={S.rdInstructionText}>
            {step === "boarding" ? (
              <>
                <Text style={{ fontWeight: "800", color: "#0A4370" }}>
                  {t(
                    "search.instructionBoardingTitle",
                    "Pick your boarding stop",
                  )}
                </Text>{" "}
                —{" "}
                {t(
                  "search.instructionBoardingDesc",
                  "where you will enter the bus",
                )}
              </>
            ) : (
              <>
                <Text style={{ fontWeight: "800", color: "#38A169" }}>
                  {t(
                    "search.instructionAlightingTitle",
                    "Pick where you get out",
                  )}
                </Text>{" "}
                —{" "}
                {t(
                  "search.instructionAlightingDesc",
                  "even if the trip continues further",
                )}
              </>
            )}
          </Text>
        </View>

        {/* Stops timeline */}
        <ScrollView
          style={S.rdScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          {stops.map((stop, idx) => {
            const isBoarding = idx === safeBoarding;
            const isAlighting = idx === safeAlighting && step === "alighting";
            const isBetween =
              step === "alighting" && idx > safeBoarding && idx < safeAlighting;

            // Tappable logic
            const canTapBoarding =
              step === "boarding" && idx < stops.length - 1;
            const canTapAlighting = step === "alighting" && idx > safeBoarding;
            const isTappable = canTapBoarding || canTapAlighting;

            const dotBg = isBoarding
              ? "#0A4370"
              : isAlighting
                ? "#38A169"
                : isBetween
                  ? "#93C5FD"
                  : "#E2E8F0";
            const rowBg = isBoarding
              ? "#EEF4FF"
              : isAlighting
                ? "#F0FFF4"
                : isBetween
                  ? "#F0F7FF"
                  : "transparent";

            return (
              <TouchableOpacity
                key={stop.id + idx}
                style={[
                  S.rdStopRow,
                  {
                    backgroundColor: rowBg,
                    opacity: isTappable || isBoarding || isAlighting ? 1 : 0.45,
                  },
                ]}
                onPress={() => isTappable && handleStopTap(idx)}
                activeOpacity={isTappable ? 0.7 : 1}
              >
                {/* Timeline */}
                <View style={S.rdTimeline}>
                  <View
                    style={[
                      S.rdDot,
                      {
                        backgroundColor: dotBg,
                        borderColor: isBoarding
                          ? "#0A4370"
                          : isAlighting
                            ? "#38A169"
                            : "#E2E8F0",
                      },
                    ]}
                  >
                    {isBoarding && (
                      <Ionicons name="person" size={9} color="#fff" />
                    )}
                    {isAlighting && (
                      <Ionicons name="flag" size={9} color="#fff" />
                    )}
                    {!isBoarding && !isAlighting && isTappable && (
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor:
                            step === "boarding" ? "#0A4370" : "#38A169",
                        }}
                      />
                    )}
                  </View>
                  {idx < stops.length - 1 && (
                    <View
                      style={[
                        S.rdLine,
                        {
                          backgroundColor:
                            isBetween || isBoarding ? "#0A4370" : "#E2E8F0",
                        },
                      ]}
                    />
                  )}
                </View>

                {/* Info */}
                <View style={S.rdStopInfo}>
                  <View style={S.rdStopTop}>
                    <Text
                      style={[
                        S.rdStopCode,
                        {
                          color: isBoarding
                            ? "#0A4370"
                            : isAlighting
                              ? "#38A169"
                              : "#6A717D",
                        },
                      ]}
                    >
                      {stop.code}
                    </Text>
                    <Text style={S.rdStopName}>{stop.name}</Text>
                    {isBoarding && (
                      <View style={S.rdBoardingBadge}>
                        <Text style={S.rdBoardingBadgeText}>
                          {t("trip.boarding", "Boarding")} ✓
                        </Text>
                      </View>
                    )}
                    {isAlighting && (
                      <View style={S.rdAlightingBadge}>
                        <Text style={S.rdAlightingBadgeText}>
                          {t("trip.alighting", "Alighting")} ✓
                        </Text>
                      </View>
                    )}
                    {isTappable && !isBoarding && !isAlighting && (
                      <View
                        style={[
                          S.rdTapHint,
                          {
                            backgroundColor:
                              step === "boarding" ? "#EEF4FF" : "#F0FFF4",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            S.rdTapHintText,
                            {
                              color:
                                step === "boarding" ? "#0A4370" : "#38A169",
                            },
                          ]}
                        >
                          {t("search.tapTo", "Tap to")}{" "}
                          {step === "boarding"
                            ? t("search.board", "board")
                            : t("search.alight", "alight")}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={S.rdStopMeta}>
                    {stop.timeFromOrigin ? (
                      <View style={S.rdMetaChip}>
                        <Ionicons
                          name="time-outline"
                          size={10}
                          color="#6A717D"
                        />
                        <Text style={S.rdMetaText}>{stop.timeFromOrigin}</Text>
                      </View>
                    ) : null}
                    {stop.distanceFromOrigin ? (
                      <View style={S.rdMetaChip}>
                        <Ionicons
                          name="navigate-outline"
                          size={10}
                          color="#6A717D"
                        />
                        <Text style={S.rdMetaText}>
                          {stop.distanceFromOrigin}
                        </Text>
                      </View>
                    ) : null}
                    {stop.priceFromOrigin !== undefined &&
                    stop.priceFromOrigin > 0 ? (
                      <View style={S.rdMetaChip}>
                        <Ionicons
                          name="pricetag-outline"
                          size={10}
                          color="#38A169"
                        />
                        <Text style={[S.rdMetaText, { color: "#38A169" }]}>
                          {route.currency}{" "}
                          {stop.priceFromOrigin.toLocaleString()}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={S.rdFooter}>
          <View style={S.rdFooterSegment}>
            <View style={S.rdFooterStop}>
              <View style={[S.rdFooterDot, { backgroundColor: "#0A4370" }]} />
              <Text style={S.rdFooterStopText} numberOfLines={1}>
                {boarding.city}
              </Text>
            </View>
            <View style={S.rdFooterArrow}>
              <View style={S.rdFooterLine} />
              <Ionicons name="arrow-forward" size={12} color="#6A717D" />
            </View>
            <View style={S.rdFooterStop}>
              <View
                style={[
                  S.rdFooterDot,
                  {
                    backgroundColor:
                      step === "alighting" ? "#38A169" : "#CBD5E0",
                  },
                ]}
              />
              <Text
                style={[
                  S.rdFooterStopText,
                  { color: step === "alighting" ? "#1A202C" : "#A0A8B4" },
                ]}
                numberOfLines={1}
              >
                {step === "alighting"
                  ? alighting.city
                  : t("search.pickAlightingPrompt", "Pick alighting →")}
              </Text>
            </View>
          </View>
          <View style={S.rdFooterRight}>
            {step === "alighting" && (
              <>
                <Text style={S.rdFooterPrice}>
                  {route.currency} {price.toLocaleString()}
                </Text>
                <TouchableOpacity style={S.rdSearchBtn} onPress={handleSearch}>
                  <Ionicons name="search" size={14} color="#fff" />
                  <Text style={S.rdSearchBtnText}>
                    {t("search.searchTrips", "Search trips")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {step === "boarding" && (
              <Text
                style={{ fontSize: 12, color: "#A0A8B4", fontWeight: "600" }}
              >
                {t("search.selectBoardingFirst", "Select boarding first")}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CompanyCard({
  company,
  onPress,
  t,
}: {
  company: Company;
  onPress: () => void;
  t: (k: string) => string;
}) {
  return (
    <TouchableOpacity
      style={S.companyCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[S.companyLogo, { backgroundColor: company.color + "18" }]}>
        {company.logoUrl &&
        typeof company.logoUrl === "string" &&
        (company.logoUrl.startsWith("http") ||
          company.logoUrl.startsWith("/")) ? (
          <RNImage
            source={{
              uri: company.logoUrl.startsWith("/")
                ? API_BASE_URL + company.logoUrl
                : company.logoUrl,
            }}
            style={{ width: 44, height: 44 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={{ fontSize: 26 }}>🚗</Text>
        )}
      </View>
      <Text style={S.companyName} numberOfLines={1}>
        {company.shortName}
      </Text>
      <View style={S.companyRating}>
        <Ionicons name="star" size={10} color="#F6AD55" />
        <Text style={S.companyRatingText}>{company.rating}</Text>
      </View>
      <Text style={S.companyTrips}>
        {company.totalTripsPerDay} {t("home.trips")}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Popular route card ───────────────────────────────────────────────────────
function PopularRouteCard({
  route,
  onBook,
  t,
}: {
  route: PopularRoute;
  onBook: () => void;
  t: (k: string, o?: any) => string;
}) {
  return (
    <TouchableOpacity style={S.routeCard} onPress={onBook} activeOpacity={0.9}>
      <View style={S.routeCardHeader}>
        <Text style={S.routeOperator}>
          {route.from.city} → {route.to.city}
        </Text>
        <View style={S.busTypeBadge}>
          <Text style={S.busTypeText}>{route.duration}</Text>
        </View>
      </View>
      <View style={S.routeRow}>
        <View style={{ alignItems: "center" }}>
          <Text style={S.routeCode}>{route.from.code}</Text>
          <Text style={S.routeCity} numberOfLines={1}>
            {route.from.city}
          </Text>
        </View>
        <View style={S.routeMid}>
          <Text style={S.routeDuration}>{route.duration}</Text>
          <View style={S.routeLine}>
            <View style={S.routeDot} />
            <View style={S.routeBar} />
            <Ionicons name="bus" size={13} color="#0A4370" />
          </View>
          <Text style={S.routeTime}>
            {route.tripsPerDay} {t("home.trips")}/day
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={S.routeCode}>{route.to.code}</Text>
          <Text style={S.routeCity} numberOfLines={1}>
            {route.to.city}
          </Text>
        </View>
      </View>
      <View style={S.routeFooter}>
        <View>
          <Text style={S.routePrice}>
            {route.currency} {route.minPrice.toLocaleString()}+
          </Text>
        </View>
        <View style={S.bookBtn}>
          <Text style={S.bookBtnText}>{t("home.bookNow")}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Recommendation card ──────────────────────────────────────────────────────
function RecommendCard({
  rec,
  onBook,
  t,
}: {
  rec: Recommendation;
  onBook: () => void;
  t: (k: string) => string;
}) {
  const { trip, reason, reasonLabel } = rec;
  const reasonColor =
    reason === "past_route"
      ? "#0A4370"
      : reason === "popular"
        ? "#38A169"
        : "#805AD5";
  return (
    <TouchableOpacity style={S.recCard} onPress={onBook} activeOpacity={0.9}>
      <View style={[S.recBadge, { backgroundColor: reasonColor + "18" }]}>
        <Ionicons
          name={
            reason === "past_route" ? "time-outline" : "trending-up-outline"
          }
          size={10}
          color={reasonColor}
        />
        <Text style={[S.recBadgeText, { color: reasonColor }]}>
          {reasonLabel}
        </Text>
      </View>
      <View style={S.recRoute}>
        <Text style={S.recCode}>{trip.from.code}</Text>
        <View style={{ flex: 1, alignItems: "center" }}>
          <View style={S.routeLine}>
            <View style={S.routeDot} />
            <View style={S.routeBar} />
            <Ionicons name="bus" size={12} color="#0A4370" />
          </View>
          <Text style={S.recOperator}>{trip.operator}</Text>
        </View>
        <Text style={S.recCode}>{trip.to.code}</Text>
      </View>
      <View style={S.recFooter}>
        <Text style={S.recPrice}>
          {trip.currency} {trip.price.toLocaleString()}
        </Text>
        <View style={S.recBookBtn}>
          <Text style={S.recBookBtnText}>{t("home.bookNow")}</Text>
          <Ionicons name="arrow-forward" size={11} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorksSection({ t }: { t: (k: string) => string }) {
  const steps = [
    {
      icon: "search-outline" as const,
      title: t("home.stepSearchTitle"),
      desc: t("home.stepSearchDesc"),
      color: "#0A4370",
    },
    {
      icon: "ticket-outline" as const,
      title: t("home.stepBookTitle"),
      desc: t("home.stepBookDesc"),
      color: "#38A169",
    },
    {
      icon: "bus-outline" as const,
      title: t("home.stepBoardTitle"),
      desc: t("home.stepBoardDesc"),
      color: "#805AD5",
    },
  ];
  return (
    <View style={S.howRoot}>
      <SectionHeader title={t("home.howItWorks")} />
      <View style={S.howRow}>
        {steps.map((s, i) => (
          <View key={i} style={S.howStep}>
            <View style={[S.howIcon, { backgroundColor: s.color + "18" }]}>
              <Ionicons name={s.icon} size={22} color={s.color} />
            </View>
            <Text style={S.howTitle}>{s.title}</Text>
            <Text style={S.howDesc}>{s.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  const { companies } = useCompanies();
  const { recommendations } = useRecommendations();
  const { routes: popularRoutes } = usePopularRoutes();

  // Search query state
  const [searchQuery, setSearchQuery] = useState("");

  const goTripDetail = (trip: Trip) =>
    router.push({
      pathname: "/trip-detail" as never,
      params: { tripId: trip.id },
    });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 5,
      }),
    ]).start();
  }, [fade, slide]);

  const goSearch = () => router.push("/search-results" as never);

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      {/* ── Hero ── */}
      <View
        style={[S.hero, { paddingTop: Platform.OS === "android" ? 48 : 60 }]}
      >
        <View style={S.heroDecor1} />
        <View style={S.heroDecor2} />
        <View style={S.heroTop}>
          <View style={S.heroBrand}>
            <RNImage
              source={require("../../assets/images/icon.png")}
              style={S.heroBrandIcon}
              resizeMode="contain"
            />
            <Text style={S.heroBrandName}>Katisha</Text>
          </View>
        </View>
        <Text style={S.heroGreeting}>{greeting(user?.first_name, t)}</Text>
        <Text style={S.heroTitle}>{t("home.whereTravel")}</Text>
        <Text style={S.heroTagline}>{t("home.tagline")}</Text>

        {/* Universal search — always mounted, manages its own modal */}
        <UniversalSearch query={searchQuery} onQueryChange={setSearchQuery} />
      </View>

      {/* ── Content sheet ── */}
      <ScrollView
        style={S.sheet}
        contentContainerStyle={S.sheetContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{
            opacity: fade,
            transform: [{ translateY: slide }],
            zIndex: 1,
            position: "relative",
          }}
        >
          {/* Featured companies */}
          {companies.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <SectionHeader
                title={t("home.featuredCompanies")}
                subtitle={t("home.featuredCompaniesSubtitle")}
                onViewAll={goSearch}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 4 }}
              >
                {companies.map((c) => (
                  <CompanyCard
                    key={c.id}
                    company={c}
                    t={t}
                    onPress={() =>
                      router.push({
                        pathname: "/search-results" as never,
                        params: { company: c.id },
                      })
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Popular routes */}
          {popularRoutes.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <SectionHeader
                title={t("home.popularRoutes")}
                subtitle={t("home.popularRoutesSubtitle")}
                onViewAll={goSearch}
              />
              {popularRoutes.map((route, i) => (
                <PopularRouteCard
                  key={i}
                  route={route}
                  onBook={() =>
                    router.push({
                      pathname: "/search-results" as never,
                      params: {
                        from: route.from.name,
                        to: route.to.name,
                        fromId: route.from.id,
                        toId: route.to.id,
                      },
                    })
                  }
                  t={t}
                />
              ))}
            </View>
          )}

          {/* How it works */}
          <HowItWorksSection t={t} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A4370" },

  // Hero
  hero: {
    paddingHorizontal: 22,
    paddingBottom: 32,
    zIndex: 10000,
    position: "relative",
  },
  heroDecor1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -100,
    right: -80,
  },
  heroDecor2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: 20,
    left: -60,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heroBrand: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroBrandIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
  },
  heroBrandName: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  heroNotif: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroGreeting: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heroTagline: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
    marginBottom: 20,
  },
  quickSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  quickSearchInput: { flex: 1, fontSize: 14, color: "#1A202C" },
  quickSearchBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0A4370",
    alignItems: "center",
    justifyContent: "center",
  },
  // Modal overlay for suggestions
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100000,
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingHorizontal: 22,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    position: "relative",
    zIndex: 100001,
  },
  suggestionsModal: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    maxHeight: 450,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    overflow: "hidden",
  },
  suggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF5",
    backgroundColor: "#F7F9FC",
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A202C",
  },

  // Search panel — 20% from top, fills rest of screen
  searchPanel: {
    position: "absolute",
    top: "20%",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  searchPanelInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  searchPanelInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F9FC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#0A4370",
  },
  searchPanelInputText: {
    flex: 1,
    fontSize: 15,
    color: "#1A202C",
    fontWeight: "500",
  },
  searchPanelClose: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0A4370",
    alignItems: "center",
    justifyContent: "center",
  },
  searchPanelMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F7F9FC",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  searchPanelMetaText: {
    fontSize: 12,
    color: "#6A717D",
    fontWeight: "600",
  },
  searchPanelSeeAll: {
    fontSize: 12,
    color: "#0A4370",
    fontWeight: "700",
  },
  searchPanelScroll: {
    flex: 1,
  },

  // Section headers
  searchSection: {
    marginTop: 8,
  },
  searchSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchSectionIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  searchSectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#1A202C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  searchSectionCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "#0A4370",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },

  // Location row
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F9FC",
  },
  locationRowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationRowCode: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0A4370",
    backgroundColor: "#EEF4FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 44,
    textAlign: "center",
  },
  locationRowName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
  },
  locationRowCity: {
    fontSize: 12,
    color: "#6A717D",
    marginTop: 1,
  },

  // Trip row (in search panel)
  tripRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F9FC",
    backgroundColor: "#fff",
  },
  tripRowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tripRowTimeBox: {
    backgroundColor: "#0A4370",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 50,
    alignItems: "center",
  },
  tripRowTime: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
  },
  tripRowRoute: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A202C",
  },
  tripRowOperator: {
    fontSize: 11,
    color: "#6A717D",
    marginTop: 2,
    fontWeight: "500",
  },
  tripRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tripRowPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0A4370",
  },

  // Route card (full detail)
  routeCard2: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: "#FAFBFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  routeCard2Header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  routeCard2Badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF4FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  routeCard2BadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0A4370",
  },
  routeCard2PriceBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  routeCard2PriceFrom: {
    fontSize: 11,
    color: "#6A717D",
    fontWeight: "500",
  },
  routeCard2Price: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0A4370",
  },
  routeCard2Row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  routeCard2City: {
    alignItems: "flex-start",
    minWidth: 70,
  },
  routeCard2Code: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1A202C",
    letterSpacing: 0.5,
  },
  routeCard2CityName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A202C",
    marginTop: 1,
    maxWidth: 70,
  },
  routeCard2StopName: {
    fontSize: 10,
    color: "#A0A8B4",
    marginTop: 1,
    maxWidth: 70,
  },
  routeCard2Mid: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
  },
  routeCard2Duration: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38A169",
  },
  routeCard2Line: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 3,
  },
  routeCard2Dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#0A4370",
  },
  routeCard2Bar: {
    flex: 1,
    height: 2,
    backgroundColor: "#CBD5E0",
  },
  routeCard2Direct: {
    fontSize: 9,
    color: "#A0A8B4",
    fontWeight: "600",
  },
  routeCard2Footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
  },
  routeCard2FooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  routeCard2FooterText: {
    fontSize: 11,
    color: "#6A717D",
    fontWeight: "500",
  },
  routeCard2SearchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0A4370",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  routeCard2SearchBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  // Company row
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F9FC",
  },
  companyRowLogo: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  companyRowName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
  },
  companyRowMeta: {
    fontSize: 12,
    color: "#6A717D",
    fontWeight: "500",
  },
  companyRowDot: {
    fontSize: 12,
    color: "#CBD5E0",
  },

  // Empty / no results
  searchEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  searchEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  searchEmptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A202C",
    textAlign: "center",
  },
  searchEmptyDesc: {
    fontSize: 13,
    color: "#6A717D",
    textAlign: "center",
    lineHeight: 18,
  },
  searchEmptyBtn: {
    marginTop: 8,
    backgroundColor: "#0A4370",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchEmptyBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  dropdownSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F7F9FC",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF5",
  },
  dropdownSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6A717D",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  quickDropdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  quickDropdownName: { fontSize: 13, fontWeight: "700", color: "#1A202C" },
  quickDropdownCity: { fontSize: 11, color: "#6A717D", marginTop: 1 },
  quickDropdownCode: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0A4370",
    backgroundColor: "#EEF4FF",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  // Empty recommendations
  emptyRec: {
    marginTop: 28,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyRecTitle: { fontSize: 14, fontWeight: "800", color: "#1A202C" },
  emptyRecDesc: {
    fontSize: 12,
    color: "#6A717D",
    textAlign: "center",
    lineHeight: 18,
  },

  // Sheet
  sheet: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 1,
    position: "relative",
  },
  sheetContent: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 140 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1A202C" },
  sectionSubtitle: { fontSize: 12, color: "#6A717D", marginTop: 2 },
  viewAll: { fontSize: 12, fontWeight: "700", color: "#0A4370", marginTop: 2 },

  // Company card
  companyCard: {
    width: 90,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  companyName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1A202C",
    textAlign: "center",
  },
  companyRating: { flexDirection: "row", alignItems: "center", gap: 2 },
  companyRatingText: { fontSize: 10, color: "#6A717D", fontWeight: "600" },
  companyTrips: { fontSize: 9, color: "#A0A8B4" },

  // Popular route card
  routeCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  routeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  routeOperator: { fontSize: 12, fontWeight: "700", color: "#1A202C" },
  busTypeBadge: {
    backgroundColor: "#EEF4FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  busTypeText: { fontSize: 10, fontWeight: "700", color: "#0A4370" },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeCode: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A202C",
    letterSpacing: 0.5,
  },
  routeCity: {
    fontSize: 10,
    color: "#6A717D",
    marginTop: 1,
    maxWidth: 60,
    textAlign: "center",
  },
  routeMid: { flex: 1, alignItems: "center", gap: 2 },
  routeDuration: { fontSize: 10, fontWeight: "600", color: "#6A717D" },
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
  routeTime: { fontSize: 10, color: "#A0A8B4", fontWeight: "500" },
  routeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  routePrice: { fontSize: 16, fontWeight: "800", color: "#0A4370" },
  routeSeats: { fontSize: 10, fontWeight: "600" },
  bookBtn: {
    backgroundColor: "#0A4370",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  bookBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Recommend card
  recCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  recBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 10,
  },
  recBadgeText: { fontSize: 9, fontWeight: "700" },
  recRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  recCode: { fontSize: 16, fontWeight: "900", color: "#1A202C" },
  recOperator: {
    fontSize: 9,
    color: "#A0A8B4",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
  },
  recFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  recPrice: { fontSize: 14, fontWeight: "800", color: "#0A4370" },
  recBookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0A4370",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  recBookBtnText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // How it works
  howRoot: { marginTop: 28, marginBottom: 8 },
  howRow: { flexDirection: "row", gap: 10 },
  howStep: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  howIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  howTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1A202C",
    textAlign: "center",
  },
  howDesc: {
    fontSize: 10,
    color: "#6A717D",
    textAlign: "center",
    lineHeight: 14,
  },

  // Route suggestion card in search modal
  routeSuggestionItem: {
    marginHorizontal: 12,
    marginVertical: 6,
    backgroundColor: "#F7F9FC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  routeSuggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  routeSuggestionCity: {
    alignItems: "flex-start",
    minWidth: 60,
  },
  routeSuggestionCode: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A202C",
    letterSpacing: 0.5,
  },
  routeSuggestionCityName: {
    fontSize: 10,
    color: "#6A717D",
    marginTop: 1,
    maxWidth: 65,
  },
  routeSuggestionMid: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
  },
  routeSuggestionDuration: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0A4370",
  },
  routeSuggestionLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 2,
  },
  routeSuggestionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0A4370",
  },
  routeSuggestionBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#CBD5E0",
  },
  routeSuggestionTrips: {
    fontSize: 9,
    color: "#A0A8B4",
    fontWeight: "500",
  },
  routeSuggestionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  routeSuggestionPriceLabel: {
    fontSize: 9,
    color: "#A0A8B4",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  routeSuggestionPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0A4370",
  },
  routeSuggestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0A4370",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  routeSuggestionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  // ─── Route Detail Modal ───────────────────────────────────────────────────
  rdSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
  },
  rdHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  rdHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  rdHeaderTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A202C",
    letterSpacing: -0.3,
  },
  rdHeaderSub: {
    fontSize: 12,
    color: "#6A717D",
    marginTop: 3,
    fontWeight: "500",
  },
  rdCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F7F9FC",
    alignItems: "center",
    justifyContent: "center",
  },
  rdInstruction: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#EEF4FF",
    borderRadius: 12,
    padding: 12,
  },
  rdInstructionText: {
    flex: 1,
    fontSize: 12,
    color: "#1A202C",
    lineHeight: 18,
  },
  rdScroll: {
    flex: 1,
  },
  rdStopRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  rdTimeline: {
    width: 32,
    alignItems: "center",
    paddingTop: 2,
  },
  rdDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
    borderColor: "#E2E8F0",
  },
  rdLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: "#E2E8F0",
    marginTop: 2,
  },
  rdStopInfo: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 8,
  },
  rdStopTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  rdStopCode: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6A717D",
    backgroundColor: "#F7F9FC",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rdStopName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
    flex: 1,
  },
  rdBoardingBadge: {
    backgroundColor: "#0A4370",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rdBoardingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  rdAlightingBadge: {
    backgroundColor: "#38A169",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rdAlightingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  rdStopMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
    flexWrap: "wrap",
  },
  rdMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F7F9FC",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rdMetaText: {
    fontSize: 11,
    color: "#6A717D",
    fontWeight: "600",
  },
  rdFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
    backgroundColor: "#fff",
    gap: 12,
  },
  rdFooterSegment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rdFooterStop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  rdFooterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rdFooterStopText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A202C",
    maxWidth: 70,
  },
  rdFooterArrow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rdFooterLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#CBD5E0",
  },
  rdFooterRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  rdFooterPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0A4370",
  },
  rdSearchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0A4370",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rdSearchBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  // Step bar
  rdStepBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  rdStepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rdStepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 10,
  },
  rdStepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rdStepCircleActive: {
    backgroundColor: "#0A4370",
  },
  rdStepCircleDone: {
    backgroundColor: "#38A169",
  },
  rdStepCircleGreen: {
    backgroundColor: "#38A169",
  },
  rdStepCircleInactive: {
    backgroundColor: "#E2E8F0",
  },
  rdStepNum: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  rdStepLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6A717D",
  },

  // Tap hint badge on each stop
  rdTapHint: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rdTapHintText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
