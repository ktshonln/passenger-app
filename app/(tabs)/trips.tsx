import { AppBar } from "@/components/ui/app-bar";
import { useBookings } from "@/hooks/use-bookings";
import type { Booking } from "@/lib/api";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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
    year: "numeric",
  });
}

const STATUS_STYLE: Record<
  string,
  {
    bg: string;
    text: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }
> = {
  confirmed: {
    bg: "#F0FFF4",
    text: "#38A169",
    icon: "checkmark-circle",
    color: "#38A169",
  },
  cancelled: {
    bg: "#FFF5F5",
    text: "#E53E3E",
    icon: "close-circle",
    color: "#E53E3E",
  },
  pending: {
    bg: "#FFFBEB",
    text: "#D97706",
    icon: "time-outline",
    color: "#D97706",
  },
};

function BookingCard({ booking }: { booking: Booking }) {
  const { t } = useTranslation();
  const cfg = STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending;

  return (
    <View style={S.card}>
      {/* Top row: ref + status */}
      <View style={S.cardTop}>
        <View style={S.cardRef}>
          <Ionicons name="ticket-outline" size={13} color="#0A4370" />
          <Text style={S.cardRefText}>{booking.bookingRef}</Text>
        </View>
        <View style={[S.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={11} color={cfg.color} />
          <Text style={[S.statusText, { color: cfg.text }]}>
            {booking.status}
          </Text>
        </View>
      </View>

      {/* Route */}
      <View style={S.routeRow}>
        <View style={S.routeStop}>
          <Text style={S.routeTime}>
            {formatTime(booking.trip.departureTime)}
          </Text>
          <Text style={S.routeCode}>{booking.trip.from.code}</Text>
          <Text style={S.routeCity} numberOfLines={1}>
            {booking.trip.from.city}
          </Text>
        </View>
        <View style={S.routeMid}>
          <Text style={S.routeDuration}>{booking.trip.duration}</Text>
          <View style={S.routeLine}>
            <View style={S.routeDot} />
            <View style={S.routeBar} />
            <Ionicons name="bus" size={14} color="#0A4370" />
          </View>
          <Text style={S.routeOperator} numberOfLines={1}>
            {booking.trip.operator}
          </Text>
        </View>
        <View style={[S.routeStop, { alignItems: "flex-end" }]}>
          <Text style={S.routeTime}>
            {formatTime(booking.trip.arrivalTime)}
          </Text>
          <Text style={S.routeCode}>{booking.trip.to.code}</Text>
          <Text style={S.routeCity} numberOfLines={1}>
            {booking.trip.to.city}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={S.cardFooter}>
        <View style={S.cardFooterLeft}>
          <View style={S.footerItem}>
            <Ionicons name="person-outline" size={11} color="#6A717D" />
            <Text style={S.footerText}>{booking.passenger.fullName}</Text>
          </View>
          <View style={S.footerItem}>
            <Ionicons name="calendar-outline" size={11} color="#6A717D" />
            <Text style={S.footerText}>{formatDate(booking.bookedAt)}</Text>
          </View>
        </View>
        <View style={S.cardFooterRight}>
          <View style={S.seatBadge}>
            <Text style={S.seatText}>
              {t("booking.seat")} {booking.seatNumber}
            </Text>
          </View>
          <Text style={S.cardPrice}>
            {booking.currency} {booking.totalPaid.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MyTripsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { bookings, refresh } = useBookings();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      refresh();
    }, [refresh, isAuthenticated]),
  );

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      {/* Header */}
      <AppBar
        title={t("myTrips.title")}
        subtitle={t(
          bookings.length === 1 ? "myTrips.booking" : "myTrips.bookings",
          { count: bookings.length },
        )}
        showBack={false}
      />

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={S.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <BookingCard booking={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={S.empty}>
            <View style={S.emptyIcon}>
              <Ionicons name="ticket-outline" size={38} color="#0A4370" />
            </View>
            <Text style={S.emptyTitle}>{t("myTrips.noBookings")}</Text>
            <Text style={S.emptyDesc}>{t("myTrips.noBookingsDesc")}</Text>
            <TouchableOpacity
              style={S.emptyBtn}
              onPress={() => router.push("/(tabs)/explore" as never)}
              activeOpacity={0.85}
            >
              <Text style={S.emptyBtnText}>{t("myTrips.searchTrips")}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F4F6" },

  header: {
    backgroundColor: "#0A4370",
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 },

  list: { padding: 16, paddingBottom: 140 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardRef: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardRefText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0A4370",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },

  routeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeStop: { width: 68 },
  routeTime: { fontSize: 18, fontWeight: "900", color: "#1A202C" },
  routeCode: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6A717D",
    marginTop: 1,
  },
  routeCity: { fontSize: 10, color: "#A0A8B4", marginTop: 1 },
  routeMid: { flex: 1, alignItems: "center", gap: 3 },
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
  routeOperator: {
    fontSize: 9,
    color: "#A0A8B4",
    fontWeight: "600",
    textAlign: "center",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  cardFooterLeft: { gap: 3 },
  cardFooterRight: { alignItems: "flex-end", gap: 4 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 11, color: "#6A717D" },
  seatBadge: {
    backgroundColor: "#EEF4FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  seatText: { fontSize: 10, fontWeight: "700", color: "#0A4370" },
  cardPrice: { fontSize: 14, fontWeight: "800", color: "#1A202C" },

  empty: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1A202C" },
  emptyDesc: {
    fontSize: 13,
    color: "#6A717D",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 6,
    backgroundColor: "#0A4370",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
