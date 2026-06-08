/**
 * Stop Selector Component
 * Allows user to select boarding and alighting stops
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

interface StopSelectorProps {
  stops: Stop[];
  selectedStopId: string | null;
  onSelect: (stopId: string) => void;
  label: string;
  type: "boarding" | "alighting";
  disabledStopIds?: string[];
}

export function StopSelector({
  stops,
  selectedStopId,
  onSelect,
  label,
  type,
  disabledStopIds = [],
}: StopSelectorProps) {
  const { t } = useTranslation();

  const openMap = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stops.map((stop) => {
          const isSelected = stop.id === selectedStopId;
          const isDisabled = disabledStopIds.includes(stop.id);

          return (
            <TouchableOpacity
              key={stop.id}
              style={[
                styles.stopCard,
                isSelected && styles.stopCardSelected,
                isDisabled && styles.stopCardDisabled,
              ]}
              onPress={() => !isDisabled && onSelect(stop.id)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <View style={styles.stopHeader}>
                <View
                  style={[
                    styles.stopIcon,
                    isSelected && styles.stopIconSelected,
                  ]}
                >
                  <Ionicons
                    name="location"
                    size={16}
                    color={isSelected ? "#fff" : "#0A4370"}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => openMap(stop.lat, stop.lng, stop.name)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="navigate-outline" size={16} color="#6A717D" />
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.stopName,
                  isSelected && styles.stopNameSelected,
                  isDisabled && styles.stopNameDisabled,
                ]}
                numberOfLines={2}
              >
                {stop.name}
              </Text>
              <Text
                style={[
                  styles.stopOrder,
                  isSelected && styles.stopOrderSelected,
                ]}
              >
                Stop {stop.order}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 12,
    paddingHorizontal: 18,
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 10,
  },
  stopCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: "#E8EDF5",
  },
  stopCardSelected: {
    borderColor: "#0A4370",
    backgroundColor: "#EEF4FF",
  },
  stopCardDisabled: {
    opacity: 0.4,
  },
  stopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stopIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  stopIconSelected: {
    backgroundColor: "#0A4370",
  },
  stopName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 4,
    minHeight: 36,
  },
  stopNameSelected: {
    color: "#0A4370",
  },
  stopNameDisabled: {
    color: "#A0A8B4",
  },
  stopOrder: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6A717D",
  },
  stopOrderSelected: {
    color: "#0A4370",
  },
});
