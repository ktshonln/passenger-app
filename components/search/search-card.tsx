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
import { TimeRangePicker } from "./time-range-picker";

interface SearchValues {
  from: string;
  fromLocation: Location | null;
  to: string;
  toLocation: Location | null;
  date: string;
  timeFrom?: string;
  timeTo?: string;
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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
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
    onSearch({
      from,
      fromLocation,
      to,
      toLocation,
      date,
      timeFrom: timeFrom || undefined,
      timeTo: timeTo || undefined,
    });
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
      className="bg-white rounded-2xl overflow-visible"
      style={{
        shadowColor: "#0A4370",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.8)",
      }}
    >
      {/* Route section */}
      <View className="px-4 pt-4 pb-3">
        <Text
          className="text-[10px] font-extrabold text-secondary-text tracking-widest uppercase mb-3"
          style={{ letterSpacing: 1.2 }}
        >
          {t("home.planJourney")}
        </Text>

        <View className="flex-row gap-3">
          {/* Dot connector */}
          <View className="items-center pt-3 pb-3 gap-1">
            <View
              className="w-2.5 h-2.5 rounded-full bg-primary"
              style={{
                shadowColor: "#0A4370",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 1,
              }}
            />
            <View
              className="w-0.5 flex-1"
              style={{ backgroundColor: "#D1D9E6" }}
            />
            <View
              className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-white"
              style={{
                shadowColor: "#0A4370",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
                elevation: 1,
              }}
            />
          </View>

          {/* Inputs */}
          <View className="flex-1 gap-2.5" style={{ zIndex: 99999 }}>
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
            className="w-9 h-9 rounded-full items-center justify-center self-center"
            style={{
              backgroundColor: "#EEF4FF",
              borderWidth: 1.5,
              borderColor: "#D6E4FF",
              shadowColor: "#0A4370",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
              elevation: 1,
            }}
            onPress={swapLocations}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={18} color="#0A4370" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px mx-4" style={{ backgroundColor: "#E8EDF5" }} />

      {/* Date section */}
      <View className="px-4 py-3">
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

      {/* Time filter */}
      <View className="px-4 pb-2">
        <TouchableOpacity
          onPress={() => setShowTimePicker((v) => !v)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: showTimePicker ? "#0A4370" : "#E8EDF5",
            backgroundColor: showTimePicker ? "#EEF4FF" : "#F8F9FB",
            shadowColor: showTimePicker ? "#0A4370" : "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: showTimePicker ? 0.08 : 0.02,
            shadowRadius: 3,
            elevation: showTimePicker ? 1 : 0,
          }}
        >
          <Ionicons
            name="time-outline"
            size={14}
            color={showTimePicker ? "#0A4370" : "#6A717D"}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: showTimePicker ? "#0A4370" : "#6A717D",
              letterSpacing: 0.1,
            }}
          >
            {showTimePicker
              ? t("search.hideTimeFilter", "Hide time filter")
              : t("search.addTimeFilter", "Add time filter")}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <View style={{ marginTop: 10 }}>
            <TimeRangePicker
              fromTime={timeFrom}
              toTime={timeTo}
              onChange={(from: string, to: string) => {
                setTimeFrom(from);
                setTimeTo(to);
              }}
            />
          </View>
        )}
      </View>

      {/* Search button */}
      <View className="px-4 pb-4">
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            className={`bg-primary rounded-xl h-12 items-center justify-center ${loading ? "opacity-60" : ""}`}
            style={{
              shadowColor: "#0A4370",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={handleSearch}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="search" size={18} color="#fff" />
                <Text
                  className="text-white text-[15px] font-extrabold"
                  style={{ letterSpacing: 0.3 }}
                >
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
