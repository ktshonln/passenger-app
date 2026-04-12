import { useTrips } from "@/hooks/use-trips";
import { Trip } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

function TripCard({ trip, onBook }: { trip: Trip; onBook: (t: Trip) => void }) {
  const { t } = useTranslation();
  const lowSeats = trip.seatsAvailable <= 5;
  return (
    <View
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        shadowColor: "#0A4370",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-lg bg-overlay items-center justify-center">
            <Ionicons name="bus-outline" size={14} color="#0A4370" />
          </View>
          <Text className="text-[13px] font-bold text-dark-text">
            {trip.operator}
          </Text>
        </View>
        <View className="bg-overlay px-2.5 py-1 rounded-full">
          <Text className="text-[11px] font-semibold text-primary">
            {trip.busType}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center px-4 py-4">
        <View className="flex-1">
          <Text className="text-[22px] font-black text-dark-text leading-tight">
            {trip.departureTime}
          </Text>
          <Text
            className="text-[12px] text-secondary-text mt-0.5"
            numberOfLines={1}
          >
            {trip.from.city}
          </Text>
        </View>
        <View className="items-center px-3 gap-1">
          <View className="flex-row items-center gap-1">
            <View className="w-1.5 h-1.5 rounded-full bg-primary" />
            <View className="w-10 h-px bg-border" />
            <Ionicons
              name="airplane-outline"
              size={13}
              color="#6A717D"
              style={{ transform: [{ rotate: "90deg" }] }}
            />
            <View className="w-10 h-px bg-border" />
            <View className="w-1.5 h-1.5 rounded-full border border-primary bg-white" />
          </View>
          <Text className="text-[11px] text-secondary-text font-medium">
            {trip.duration}
          </Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-[22px] font-black text-dark-text leading-tight">
            {trip.arrivalTime}
          </Text>
          <Text
            className="text-[12px] text-secondary-text mt-0.5"
            numberOfLines={1}
          >
            {trip.to.city}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between px-4 pb-4 pt-3 border-t border-border">
        <View>
          <Text className="text-[18px] font-black text-primary">
            {trip.currency} {trip.price.toLocaleString()}
          </Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Ionicons
              name={lowSeats ? "warning-outline" : "people-outline"}
              size={11}
              color={lowSeats ? "#E53E3E" : "#6A717D"}
            />
            <Text
              className={`text-[11px] ${lowSeats ? "text-danger font-semibold" : "text-secondary-text"}`}
            >
              {lowSeats
                ? t("trips.seatsLeft", { count: trip.seatsAvailable })
                : t("trips.seats", { count: trip.seatsAvailable })}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          className="bg-primary px-5 py-2.5 rounded-xl"
          onPress={() => onBook(trip)}
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-[13px]">
            {t("trips.bookNow")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS[parseInt(m) - 1]} ${y}`;
}

export default function TripsScreen() {
  const { from, to, date } = useLocalSearchParams<{
    from: string;
    to: string;
    date: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { trips, loading, error, searched, search } = useTrips();

  useEffect(() => {
    if (from && to && date) search({ from, to, date });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, date]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />
      <View
        className="bg-primary px-5 pb-5"
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1.5 mb-3"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
          <Text className="text-[13px] text-white/70 font-medium">
            {t("common.back")}
          </Text>
        </TouchableOpacity>
        <Text className="text-[22px] font-black text-white leading-tight">
          {from} → {to}
        </Text>
        <Text className="text-[13px] text-white/60 mt-1">
          {formatDate(date)}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#0A4370" />
          <Text className="text-[13px] text-secondary-text">
            {t("trips.findingTrips")}
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center gap-3 px-10">
          <View className="w-16 h-16 rounded-2xl bg-overlay items-center justify-center mb-1">
            <Ionicons name="cloud-offline-outline" size={32} color="#0A4370" />
          </View>
          <Text className="text-[15px] font-bold text-dark-text text-center">
            {error}
          </Text>
          <TouchableOpacity
            className="bg-primary px-7 py-3 rounded-xl mt-1"
            onPress={() => search({ from, to, date })}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-sm">
              {t("trips.tryAgain")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-10"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            searched && trips.length > 0 ? (
              <Text className="text-[12px] text-secondary-text font-semibold mb-3 ml-0.5">
                {t(
                  trips.length === 1
                    ? "trips.tripAvailable"
                    : "trips.tripsAvailable",
                  { count: trips.length },
                )}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            searched ? (
              <View className="items-center justify-center gap-3 px-10 mt-20">
                <View className="w-16 h-16 rounded-2xl bg-overlay items-center justify-center mb-1">
                  <Ionicons name="bus-outline" size={32} color="#0A4370" />
                </View>
                <Text className="text-[17px] font-bold text-dark-text">
                  {t("trips.noTripsFound")}
                </Text>
                <Text className="text-[13px] text-secondary-text text-center">
                  {t("trips.tryDifferent")}
                </Text>
                <TouchableOpacity
                  className="bg-primary px-7 py-3 rounded-xl mt-1"
                  onPress={() => router.back()}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-sm">
                    {t("trips.modifySearch")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onBook={(trip) =>
                router.push({
                  pathname: "/booking" as never,
                  params: { trip: JSON.stringify(trip) },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
        />
      )}
    </View>
  );
}
