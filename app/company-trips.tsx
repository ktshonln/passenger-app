import { TripCard } from "@/components/search/trip-card";
import { TripCardSkeleton } from "@/components/search/trip-card-skeleton";
import { AppBar } from "@/components/ui/app-bar";
import { useCompanies } from "@/hooks/use-companies";
import { useTrips } from "@/hooks/use-trips";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CompanyTripsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { companyId } = useLocalSearchParams();
  const { companies } = useCompanies();
  const {
    trips: searchResults,
    search: searchTrips,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    retry,
    searched,
  } = useTrips();

  const company = companies.find((c) => c.id === companyId);

  useEffect(() => {
    if (companyId) {
      searchTrips({ company_id: companyId as string });
    }
  }, [companyId]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      {/* App Bar */}
      <AppBar
        title={company?.name || t("search.title")}
        subtitle={
          searched
            ? `${searchResults.length} ${searchResults.length === 1 ? "trip" : "trips"}`
            : undefined
        }
        showBack={true}
      />

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
            {/* Skeleton loading */}
            {loading && searchResults.length === 0 && <TripCardSkeleton />}

            {/* Error banner */}
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#E53E3E"
                />
                <Text style={styles.errorBannerText}>{error}</Text>
                <TouchableOpacity onPress={retry} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>
                    {t("search.retry", "Retry")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          searched && !loading ? (
            <View style={styles.empty}>
              <Ionicons name="bus-outline" size={52} color="#CBD5E0" />
              <Text style={styles.emptyTitle}>{t("search.noResults")}</Text>
              <Text style={styles.emptyHint}>{t("search.noResultsHint")}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            company={company}
            onBook={() =>
              router.push({
                pathname: "/trip-detail" as never,
                params: { tripId: item.id },
              })
            }
            t={t}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F9FC" },

  listContent: { paddingBottom: 140 },

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

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 18,
    marginBottom: 14,
    marginTop: 14,
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
