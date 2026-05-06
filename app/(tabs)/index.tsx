import { useCompanies } from "@/hooks/use-companies";
import { useLocations } from "@/hooks/use-locations";
import { usePopularRoutes } from "@/hooks/use-popular-routes";
import { useRecommendations } from "@/hooks/use-recommendations";
import type {
  Company,
  LocationSuggestion,
  PopularRoute,
  Recommendation,
  Trip,
} from "@/lib/api";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
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
  return (
    <View style={S.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={S.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={S.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll}>
          <Text style={S.viewAll}>View all →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Inline quick search ──────────────────────────────────────────────────────
function QuickSearch({
  onSelect,
}: {
  onSelect: (loc: LocationSuggestion) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { results, loading } = useLocations(query);
  const showDropdown = focused && query.length > 0 && results.length > 0;

  return (
    <View style={{ zIndex: 100 }}>
      <View style={S.quickSearch}>
        <Ionicons name="search-outline" size={16} color="#6A717D" />
        <TextInput
          style={S.quickSearchInput}
          placeholder={t("home.departurePlaceholder")}
          placeholderTextColor="#A0A8B4"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {loading ? (
          <View style={S.quickSearchBtn}>
            <Ionicons name="hourglass-outline" size={14} color="#fff" />
          </View>
        ) : (
          <View style={S.quickSearchBtn}>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </View>
        )}
      </View>

      {showDropdown && (
        <View style={S.quickDropdown}>
          {results.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={S.quickDropdownItem}
              onPress={() => {
                setQuery(item.name);
                setFocused(false);
                onSelect(item);
              }}
              activeOpacity={0.7}
            >
              <View style={S.quickDropdownIcon}>
                <Ionicons name="location" size={14} color="#0A4370" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.quickDropdownName}>{item.name}</Text>
                <Text style={S.quickDropdownCity}>{item.city}</Text>
              </View>
              <Text style={S.quickDropdownCode}>{item.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
function CompanyCard({
  company,
  onPress,
}: {
  company: Company;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={S.companyCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[S.companyLogo, { backgroundColor: company.color + "18" }]}>
        <Text style={{ fontSize: 26 }}>{company.logoUrl}</Text>
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
  onSearch,
  t,
}: {
  route: PopularRoute;
  onSearch: () => void;
  t: (k: string, o?: any) => string;
}) {
  return (
    <View style={S.routeCard}>
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
        <TouchableOpacity
          style={S.bookBtn}
          onPress={onSearch}
          activeOpacity={0.85}
        >
          <Text style={S.bookBtnText}>{t("common.search")}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    <View style={S.recCard}>
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
        <TouchableOpacity
          style={S.recBookBtn}
          onPress={onBook}
          activeOpacity={0.85}
        >
          <Text style={S.recBookBtnText}>{t("home.bookNow")}</Text>
          <Ionicons name="arrow-forward" size={11} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
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

  const goBook = (trip: Trip) =>
    router.push({
      pathname: "/booking" as never,
      params: { trip: JSON.stringify(trip) },
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

  const goSearch = () => router.push("/(tabs)/explore" as never);

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
          {/* <TouchableOpacity style={S.heroNotif} onPress={goSearch}>
            <Ionicons name="search-outline" size={20} color="#fff" />
          </TouchableOpacity> */}
        </View>
        <Text style={S.heroGreeting}>{greeting(user?.first_name, t)}</Text>
        <Text style={S.heroTitle}>{t("home.whereTravel")}</Text>
        <Text style={S.heroTagline}>{t("home.tagline")}</Text>

        {/* Quick search CTA */}
        <QuickSearch
          onSelect={(loc) =>
            router.push({
              pathname: "/(tabs)/explore" as never,
              params: { from: loc.name, fromId: loc.id },
            })
          }
        />
      </View>

      {/* ── Content sheet ── */}
      <ScrollView
        style={S.sheet}
        contentContainerStyle={S.sheetContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{ opacity: fade, transform: [{ translateY: slide }] }}
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
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/explore" as never,
                        params: { company: c.id },
                      })
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recommended */}
          {recommendations.length > 0 ? (
            <View style={{ marginTop: 28 }}>
              <SectionHeader
                title={t("home.recommendedForYou")}
                subtitle={t("home.basedOnTrips")}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              >
                {recommendations.map((rec) => (
                  <RecommendCard
                    key={rec.trip.id}
                    rec={rec}
                    onBook={() => goBook(rec.trip)}
                    t={t}
                  />
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={S.emptyRec}>
              <Ionicons name="sparkles-outline" size={28} color="#CBD5E0" />
              <Text style={S.emptyRecTitle}>{t("home.noRecommendations")}</Text>
              <Text style={S.emptyRecDesc}>
                {t("home.noRecommendationsDesc")}
              </Text>
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
                  onSearch={() =>
                    router.push({
                      pathname: "/(tabs)/explore" as never,
                      params: { from: route.from.name, to: route.to.name },
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
  hero: { paddingHorizontal: 22, paddingBottom: 32, overflow: "hidden" },
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
  quickDropdown: {
    position: "absolute",
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
    overflow: "hidden",
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
});
