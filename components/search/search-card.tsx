import { Location } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DatePicker } from "./date-picker";
import { LocationInput } from "./location-input";

interface SearchValues {
  from: string;
  fromLocation: Location | null;
  to: string;
  toLocation: Location | null;
  date: string;
}

interface Props {
  onSearch: (values: SearchValues) => void;
  loading?: boolean;
}

export function SearchCard({ onSearch, loading }: Props) {
  const { t } = useTranslation();
  const [from, setFrom] = useState("");
  const [fromLocation, setFromLocation] = useState<Location | null>(null);
  const [to, setTo] = useState("");
  const [toLocation, setToLocation] = useState<Location | null>(null);
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const btnScale = useRef(new Animated.Value(1)).current;

  function validate() {
    const e: Record<string, string> = {};
    if (!from.trim()) e.from = t("home.errorFrom");
    if (!to.trim()) e.to = t("home.errorTo");
    if (!date) e.date = t("home.errorDate");
    if (
      from.trim() &&
      to.trim() &&
      from.trim().toLowerCase() === to.trim().toLowerCase()
    )
      e.to = t("home.errorSameLocation");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handlePressIn() {
    Animated.spring(btnScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
    }).start();
  }
  function handlePressOut() {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  }

  function handleSearch() {
    if (!validate()) return;
    onSearch({ from, fromLocation, to, toLocation, date });
  }

  function swapLocations() {
    setFrom(to);
    setFromLocation(toLocation);
    setTo(from);
    setToLocation(fromLocation);
    setErrors({});
  }

  return (
    <View
      className="bg-white rounded-3xl overflow-visible"
      style={{
        shadowColor: "#0A4370",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 32,
        elevation: 10,
      }}
    >
      {/* Route section */}
      <View className="px-5 pt-5 pb-4">
        <Text className="text-[11px] font-bold text-secondary-text tracking-widest uppercase mb-4">
          {t("home.planJourney")}
        </Text>

        <View className="flex-row gap-3">
          {/* Dot connector */}
          <View className="items-center pt-3.5 pb-3.5 gap-1">
            <View className="w-3 h-3 rounded-full bg-primary" />
            <View className="w-0.5 flex-1 bg-border" />
            <View className="w-3 h-3 rounded-full border-2 border-primary bg-white" />
          </View>

          {/* Inputs */}
          <View className="flex-1 gap-3">
            <LocationInput
              label={t("home.from")}
              placeholder={t("home.departurePlaceholder")}
              value={from}
              onChangeText={(text) => {
                setFrom(text);
                setFromLocation(null);
                setErrors((e) => ({ ...e, from: "" }));
              }}
              onSelect={(loc) => {
                setFrom(loc.name);
                setFromLocation(loc);
                setErrors((e) => ({ ...e, from: "" }));
              }}
              error={errors.from}
            />
            <LocationInput
              label={t("home.to")}
              placeholder={t("home.destinationPlaceholder")}
              value={to}
              onChangeText={(text) => {
                setTo(text);
                setToLocation(null);
                setErrors((e) => ({ ...e, to: "" }));
              }}
              onSelect={(loc) => {
                setTo(loc.name);
                setToLocation(loc);
                setErrors((e) => ({ ...e, to: "" }));
              }}
              error={errors.to}
            />
          </View>

          {/* Swap */}
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center self-center"
            onPress={swapLocations}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={18} color="#0A4370" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-border mx-5" />

      {/* Date section */}
      <View className="px-5 py-4">
        <DatePicker
          label={t("home.travelDate")}
          placeholder={t("home.selectDate")}
          value={date}
          onChange={(d) => {
            setDate(d);
            setErrors((e) => ({ ...e, date: "" }));
          }}
          error={errors.date}
        />
      </View>

      {/* Search button */}
      <View className="px-5 pb-5">
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            className={`bg-primary rounded-2xl h-14 items-center justify-center ${loading ? "opacity-60" : ""}`}
            onPress={handleSearch}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center gap-2.5">
                <Ionicons name="search" size={19} color="#fff" />
                <Text className="text-white text-[16px] font-bold tracking-wide">
                  {t("home.searchBuses")}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
