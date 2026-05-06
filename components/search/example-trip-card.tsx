import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export function ExampleTripCard() {
  const { t } = useTranslation();

  return (
    <View style={S.container}>
      {/* Info header */}
      <View style={S.infoHeader}>
        <Ionicons name="information-circle" size={20} color="#0A4370" />
        <Text style={S.infoTitle}>{t("search.exampleTitle")}</Text>
      </View>
      <Text style={S.infoSubtitle}>{t("search.exampleSubtitle")}</Text>

      {/* Example card */}
      <View style={S.card}>
        {/* Header */}
        <View style={S.cardHeader}>
          <View style={S.cardOperator}>
            <View style={S.logoPlaceholder}>
              <Text style={S.logoText}>🚌</Text>
            </View>
            <View>
              <Text style={S.cardOperatorName}>
                {t("search.exampleCompany")}
              </Text>
              <View style={S.cardRatingRow}>
                <Ionicons name="star" size={10} color="#F6AD55" />
                <Text style={S.cardRatingText}>4.5</Text>
                <Text style={S.cardRatingDot}>·</Text>
                <Text style={S.cardRatingText}>
                  {t("search.exampleBusType")}
                </Text>
              </View>
            </View>
          </View>
          <View style={S.seatsBadge}>
            <Ionicons name="people-outline" size={10} color="#38A169" />
            <Text style={S.seatsText}>{t("search.exampleSeats")}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={S.cardRoute}>
          <View style={S.cardStop}>
            <Text style={S.cardTime}>08:00</Text>
            <Text style={S.cardCode}>KGL</Text>
            <Text style={S.cardCity}>{t("search.exampleCity1")}</Text>
          </View>
          <View style={S.cardMid}>
            <Text style={S.cardDuration}>{t("search.exampleDuration")}</Text>
            <View style={S.routeLine}>
              <View style={S.routeDot} />
              <View style={S.routeBar} />
              <Ionicons name="bus" size={14} color="#0A4370" />
            </View>
            <View style={S.directBadge}>
              <Text style={S.directText}>{t("search.exampleDirect")}</Text>
            </View>
          </View>
          <View style={[S.cardStop, { alignItems: "flex-end" }]}>
            <Text style={S.cardTime}>11:30</Text>
            <Text style={S.cardCode}>MUS</Text>
            <Text style={S.cardCity}>{t("search.exampleCity2")}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={S.cardFooter}>
          <View>
            <Text style={S.cardPrice}>{t("search.examplePrice")}</Text>
            <Text style={S.cardPriceSub}>{t("search.examplePerPerson")}</Text>
          </View>
          <View style={S.bookBtnPlaceholder}>
            <Text style={S.bookBtnText}>{t("search.exampleBookNow")}</Text>
            <Ionicons name="arrow-forward" size={13} color="#fff" />
          </View>
        </View>
      </View>

      {/* Features list */}
      <View style={S.features}>
        <View style={S.feature}>
          <Ionicons name="checkmark-circle" size={16} color="#38A169" />
          <Text style={S.featureText}>{t("search.featureRealtime")}</Text>
        </View>
        <View style={S.feature}>
          <Ionicons name="checkmark-circle" size={16} color="#38A169" />
          <Text style={S.featureText}>{t("search.featureCompare")}</Text>
        </View>
        <View style={S.feature}>
          <Ionicons name="checkmark-circle" size={16} color="#38A169" />
          <Text style={S.featureText}>{t("search.featureInstant")}</Text>
        </View>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginTop: 20,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0A4370",
    letterSpacing: -0.2,
  },
  infoSubtitle: {
    fontSize: 13,
    color: "#6A717D",
    marginBottom: 16,
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: "#0A4370",
    borderStyle: "dashed",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardOperator: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  logoText: { fontSize: 20 },
  cardOperatorName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A202C",
    letterSpacing: -0.2,
  },
  cardRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  cardRatingText: { fontSize: 11, color: "#6A717D", fontWeight: "600" },
  cardRatingDot: { fontSize: 11, color: "#C8CDD6", marginHorizontal: 1 },
  seatsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FFF4",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#C6F6D5",
  },
  seatsText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#38A169",
    letterSpacing: 0.2,
  },
  cardRoute: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardStop: { width: 70 },
  cardTime: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A202C",
    letterSpacing: -0.5,
  },
  cardCode: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6A717D",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  cardCity: {
    fontSize: 10,
    color: "#A0A8B4",
    marginTop: 1,
    fontWeight: "500",
  },
  cardMid: { flex: 1, alignItems: "center", gap: 4 },
  cardDuration: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6A717D",
    letterSpacing: 0.2,
  },
  directBadge: {
    backgroundColor: "#F0FFF4",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#C6F6D5",
  },
  directText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#38A169",
    letterSpacing: 0.3,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1.5,
    borderTopColor: "#F0F2F5",
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0A4370",
    letterSpacing: -0.5,
  },
  cardPriceSub: {
    fontSize: 10,
    color: "#A0A8B4",
    marginTop: 1,
    fontWeight: "500",
  },
  bookBtnPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0A4370",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  bookBtnText: { fontSize: 13, fontWeight: "800", color: "#fff" },
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
  features: {
    marginTop: 16,
    gap: 10,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: "#1A202C",
    fontWeight: "600",
  },
});
