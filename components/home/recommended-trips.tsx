import type { Trip } from "@/lib/api";
import { Recommendation } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  recommendations: Recommendation[];
  onBook: (trip: Trip) => void;
}

const REASON_ICON: Record<
  Recommendation["reason"],
  keyof typeof Ionicons.glyphMap
> = {
  past_route: "time-outline",
  popular: "trending-up-outline",
  nearby: "location-outline",
};

const REASON_COLOR: Record<Recommendation["reason"], string> = {
  past_route: "#0A4370",
  popular: "#38A169",
  nearby: "#805AD5",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function TripCard({
  rec,
  onBook,
}: {
  rec: Recommendation;
  onBook: () => void;
}) {
  const { trip, reason, reasonLabel } = rec;
  const seatsLow = trip.seatsAvailable <= 5;
  const accentColor = REASON_COLOR[reason];

  return (
    <View style={styles.card}>
      <View
        style={[styles.reasonBadge, { backgroundColor: accentColor + "18" }]}
      >
        <Ionicons name={REASON_ICON[reason]} size={11} color={accentColor} />
        <Text style={[styles.reasonText, { color: accentColor }]}>
          {reasonLabel}
        </Text>
      </View>
      <View style={styles.routeRow}>
        <View style={styles.routeStop}>
          <Text style={styles.stopCode}>{trip.from.code}</Text>
          <Text style={styles.stopCity} numberOfLines={1}>
            {trip.from.city}
          </Text>
        </View>
        <View style={styles.routeMiddle}>
          <Text style={styles.duration}>{trip.duration}</Text>
          <View style={styles.routeLine}>
            <View style={styles.routeDot} />
            <View style={styles.routeLineBar} />
            <Ionicons name="bus" size={14} color="#0A4370" />
          </View>
          <Text style={styles.operator} numberOfLines={1}>
            {trip.operator}
          </Text>
        </View>
        <View style={[styles.routeStop, { alignItems: "flex-end" }]}>
          <Text style={styles.stopCode}>{trip.to.code}</Text>
          <Text style={styles.stopCity} numberOfLines={1}>
            {trip.to.city}
          </Text>
        </View>
      </View>
      <View style={styles.timesRow}>
        <Text style={styles.time}>{formatTime(trip.departureTime)}</Text>
        <Text style={styles.time}>{formatTime(trip.arrivalTime)}</Text>
      </View>
      <View style={styles.footer}>
        <View>
          <Text style={styles.price}>
            {trip.currency} {trip.price.toLocaleString()}
          </Text>
          <View style={styles.seatsRow}>
            <Ionicons
              name="people-outline"
              size={11}
              color={seatsLow ? "#E53E3E" : "#38A169"}
            />
            <Text
              style={[
                styles.seats,
                { color: seatsLow ? "#E53E3E" : "#38A169" },
              ]}
            >
              {seatsLow
                ? `Only ${trip.seatsAvailable} left`
                : `${trip.seatsAvailable} seats`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={onBook}
          activeOpacity={0.8}
        >
          <Text style={styles.bookBtnText}>Book</Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function RecommendedTrips({ recommendations, onBook }: Props) {
  if (!recommendations.length) return null;
  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {recommendations.map((rec) => (
          <TripCard
            key={rec.trip.id}
            rec={rec}
            onBook={() => onBook(rec.trip)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 28 },
  scroll: { gap: 12, paddingRight: 4 },
  card: {
    width: 240,
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
  reasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  reasonText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeStop: { width: 52 },
  stopCode: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A202C",
    letterSpacing: 0.5,
  },
  stopCity: { fontSize: 10, color: "#6A717D", marginTop: 1 },
  routeMiddle: { flex: 1, alignItems: "center", gap: 2 },
  duration: { fontSize: 10, fontWeight: "600", color: "#6A717D" },
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
  routeLineBar: { flex: 1, height: 1.5, backgroundColor: "#CBD5E0" },
  operator: {
    fontSize: 9,
    color: "#A0A8B4",
    fontWeight: "600",
    maxWidth: 80,
    textAlign: "center",
  },
  timesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  time: { fontSize: 13, fontWeight: "700", color: "#1A202C" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  price: { fontSize: 14, fontWeight: "800", color: "#0A4370" },
  seatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  seats: { fontSize: 10, fontWeight: "600" },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0A4370",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bookBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
