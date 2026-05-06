import type { Company, Trip } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.katisha.online";

/** Returns a usable image URL or null (use fallback). */
export function resolveLogoUrl(path: string | undefined): string | null {
  if (!path || path.trim() === "") return null;
  // Emoji detection: if the string contains no ASCII letters/digits it's an emoji
  if (!/[a-zA-Z0-9/._-]/.test(path)) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return null;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TripCardProps {
  trip: Trip;
  company: Company | undefined;
  onBook: () => void;
  t: (key: string, opts?: any) => string;
}

export function TripCard({ trip, company, onBook, t }: TripCardProps) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = resolveLogoUrl(company?.logoUrl);
  const seatsLow = trip.seatsAvailable <= 5;

  return (
    <View style={S.card}>
      {/* Header */}
      <View style={S.cardHeader}>
        <View style={S.cardOperator}>
          {/* Logo or fallback */}
          {logoUrl && !imgError ? (
            <Image
              source={{ uri: logoUrl }}
              style={S.logo}
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={S.logoFallback}>
              <Text style={S.logoLetter}>
                {trip.operator[0]?.toUpperCase()}
              </Text>
            </View>
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
        {!seatsLow && (
          <View style={S.seatsBadge}>
            <Ionicons name="people-outline" size={10} color="#38A169" />
            <Text style={S.seatsText}>{trip.seatsAvailable} seats</Text>
          </View>
        )}
      </View>

      {/* Route */}
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

      {/* Footer */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  card: {
    marginHorizontal: 18,
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#E8EDF5",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  cardOperator: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 12 },
  logoFallback: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  logoLetter: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0A4370",
    letterSpacing: -0.5,
  },
  cardOperatorName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A202C",
    letterSpacing: -0.2,
  },
  cardRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  cardRatingText: { fontSize: 12, color: "#6A717D", fontWeight: "600" },
  cardRatingDot: { fontSize: 12, color: "#C8CDD6", marginHorizontal: 2 },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#E53E3E",
    letterSpacing: 0.2,
  },
  seatsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FFF4",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#C6F6D5",
  },
  seatsText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#38A169",
    letterSpacing: 0.2,
  },
  cardRoute: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardStop: { width: 75 },
  cardTime: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1A202C",
    letterSpacing: -0.5,
  },
  cardCode: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6A717D",
    marginTop: 3,
    letterSpacing: 0.3,
  },
  cardCity: { fontSize: 11, color: "#A0A8B4", marginTop: 2, fontWeight: "500" },
  cardMid: { flex: 1, alignItems: "center", gap: 5 },
  cardDuration: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6A717D",
    letterSpacing: 0.2,
  },
  directBadge: {
    backgroundColor: "#F0FFF4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#C6F6D5",
  },
  directText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38A169",
    letterSpacing: 0.3,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: "#F0F2F5",
  },
  cardPrice: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0A4370",
    letterSpacing: -0.5,
  },
  cardPriceSub: {
    fontSize: 11,
    color: "#A0A8B4",
    marginTop: 2,
    fontWeight: "500",
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#0A4370",
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
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
});
