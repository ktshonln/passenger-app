/**
 * Seat Counter Component
 * Allows user to select number of seats (1-10)
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SeatCounterProps {
  count: number;
  onChange: (count: number) => void;
  max?: number;
  availableSeats: number;
}

export function SeatCounter({
  count,
  onChange,
  max = 10,
  availableSeats,
}: SeatCounterProps) {
  const { t } = useTranslation();

  const maxAllowed = Math.min(max, availableSeats);
  const canDecrease = count > 1;
  const canIncrease = count < maxAllowed;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {t("trip.numberOfSeats", "Number of Seats")}
        </Text>
        <Text style={styles.available}>
          {availableSeats} {t("trip.seatsAvailable", "available")}
        </Text>
      </View>

      <View style={styles.counter}>
        <TouchableOpacity
          style={[styles.button, !canDecrease && styles.buttonDisabled]}
          onPress={() => canDecrease && onChange(count - 1)}
          disabled={!canDecrease}
          activeOpacity={0.7}
        >
          <Ionicons
            name="remove"
            size={24}
            color={canDecrease ? "#0A4370" : "#CBD5E0"}
          />
        </TouchableOpacity>

        <View style={styles.countContainer}>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.countLabel}>
            {count === 1 ? t("trip.seat", "seat") : t("trip.seats", "seats")}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, !canIncrease && styles.buttonDisabled]}
          onPress={() => canIncrease && onChange(count + 1)}
          disabled={!canIncrease}
          activeOpacity={0.7}
        >
          <Ionicons
            name="add"
            size={24}
            color={canIncrease ? "#0A4370" : "#CBD5E0"}
          />
        </TouchableOpacity>
      </View>

      {count >= maxAllowed && (
        <Text style={styles.maxNote}>
          {t("trip.maxSeatsReached", "Maximum seats reached")}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
  },
  available: {
    fontSize: 12,
    fontWeight: "600",
    color: "#38A169",
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D6E4FF",
  },
  buttonDisabled: {
    backgroundColor: "#F7F9FC",
    borderColor: "#E8EDF5",
  },
  countContainer: {
    alignItems: "center",
    minWidth: 80,
  },
  count: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0A4370",
    lineHeight: 40,
  },
  countLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6A717D",
    marginTop: 2,
  },
  maxNote: {
    fontSize: 11,
    fontWeight: "600",
    color: "#E53E3E",
    textAlign: "center",
    marginTop: 12,
  },
});
