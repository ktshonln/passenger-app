import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface Props {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
}

const MONTH_SHORT = [
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

function formatDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTH_SHORT[parseInt(m) - 1]} ${y}`;
}

function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DatePicker({
  label,
  placeholder,
  value,
  onChange,
  error,
}: Props) {
  const [open, setOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = value ? new Date(value + "T00:00:00") : today;

  return (
    <View>
      <Text className="text-[11px] font-bold text-secondary-text mb-1.5 tracking-widest uppercase">
        {label}
      </Text>

      {/* Trigger */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 12,
          height: 48,
          paddingHorizontal: 14,
          backgroundColor: error ? "#FFF5F5" : "#F8F9FB",
          borderWidth: error ? 1.5 : 1,
          borderColor: error ? "#E53E3E" : "#E2E8F0",
        }}
      >
        <Ionicons
          name="calendar-outline"
          size={17}
          color={error ? "#E53E3E" : value ? "#0A4370" : "#A0A8B4"}
        />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 15,
              color: value ? "#1A202C" : "#A0A8B4",
              fontWeight: value ? "600" : "400",
            }}
          >
            {value ? formatDisplay(value) : (placeholder ?? "Select a date")}
          </Text>
        </View>
        <View style={{ width: 17 }} />
      </TouchableOpacity>

      {!!error && (
        <View className="flex-row items-center gap-1 mt-1">
          <Ionicons name="alert-circle-outline" size={12} color="#E53E3E" />
          <Text className="text-[11px] text-danger">{error}</Text>
        </View>
      )}

      <DateTimePickerModal
        isVisible={open}
        mode="date"
        date={selectedDate}
        minimumDate={today}
        onConfirm={(date) => {
          setOpen(false);
          onChange(toIso(date));
        }}
        onCancel={() => setOpen(false)}
        isDarkModeEnabled={false}
        display="spinner"
        buttonTextColorIOS="#0A4370"
        pickerContainerStyleIOS={{ backgroundColor: "#FFFFFF" }}
        textColor="#1A202C"
      />
    </View>
  );
}
