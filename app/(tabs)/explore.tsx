import { useBookings } from "@/hooks/use-bookings";
import { Booking } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { FlatList, Platform, Text, TouchableOpacity, View } from "react-native";

const STATUS_CONFIG = {
  confirmed: {
    bg: "bg-green-50",
    text: "text-success",
    icon: "checkmark-circle" as const,
    iconColor: "#38A169",
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-danger",
    icon: "close-circle" as const,
    iconColor: "#E53E3E",
  },
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    icon: "time-outline" as const,
    iconColor: "#D97706",
  },
};

function BookingCard({ booking }: { booking: Booking }) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;

  return (
    <View
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        shadowColor: "#0A4370",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      {/* Top row */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="ticket-outline" size={13} color="#0A4370" />
          <Text className="text-[13px] font-black text-primary tracking-wide">
            {booking.bookingRef}
          </Text>
        </View>
        <View
          className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${cfg.bg}`}
        >
          <Ionicons name={cfg.icon} size={11} color={cfg.iconColor} />
          <Text className={`text-[11px] font-bold capitalize ${cfg.text}`}>
            {booking.status}
          </Text>
        </View>
      </View>

      {/* Route */}
      <View className="flex-row items-center px-4 py-3.5">
        <View className="flex-1">
          <Text className="text-[20px] font-black text-dark-text leading-tight">
            {booking.trip?.departureTime}
          </Text>
          <Text
            className="text-[12px] text-secondary-text mt-0.5"
            numberOfLines={1}
          >
            {booking.trip?.from?.city}
          </Text>
        </View>
        <View className="items-center px-3">
          <Ionicons name="arrow-forward" size={15} color="#6A717D" />
          <Text className="text-[11px] text-secondary-text mt-0.5">
            {booking.trip?.duration}
          </Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-[20px] font-black text-dark-text leading-tight">
            {booking.trip?.arrivalTime}
          </Text>
          <Text
            className="text-[12px] text-secondary-text mt-0.5"
            numberOfLines={1}
          >
            {booking.trip?.to?.city}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between px-4 pb-3.5 pt-3 border-t border-border">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="person-outline" size={12} color="#6A717D" />
          <Text className="text-[12px] text-secondary-text" numberOfLines={1}>
            {booking.passenger?.fullName}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1 bg-overlay px-2 py-0.5 rounded-full">
            <Text className="text-[11px] font-semibold text-primary">
              Seat {booking.seatNumber}
            </Text>
          </View>
          <Text className="text-[12px] font-bold text-dark-text">
            {booking.currency} {booking.totalPaid?.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MyTripsScreen() {
  const { bookings, refresh } = useBookings();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <View className="flex-1 bg-background">
      <View
        className="bg-primary px-5 pb-6"
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60 }}
      >
        <Text className="text-[26px] font-black text-white">My Trips</Text>
        <Text className="text-[13px] text-white/60 mt-1">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-10"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <BookingCard booking={item} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          <View className="items-center justify-center gap-3 mt-24 px-8">
            <View
              className="w-20 h-20 rounded-[24px] bg-white items-center justify-center mb-1"
              style={{
                shadowColor: "#0A4370",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 4,
              }}
            >
              <Ionicons name="ticket-outline" size={36} color="#0A4370" />
            </View>
            <Text className="text-[18px] font-black text-dark-text">
              No bookings yet
            </Text>
            <Text className="text-[13px] text-secondary-text text-center leading-5">
              Your booked trips will appear here
            </Text>
            <TouchableOpacity
              className="bg-primary px-7 py-3 rounded-xl mt-1"
              onPress={() => router.push("/" as never)}
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-[13px]">
                Search Trips
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
