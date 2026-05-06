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
      <Text
        className="text-[12px] font-extrabold text-secondary-text mb-2 tracking-widest uppercase"
        style={{ letterSpacing: 1.2 }}
      >
        {label}
      </Text>

      {/* Trigger */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 14,
          height: 52,
          paddingHorizontal: 16,
          backgroundColor: error ? "#FFF5F5" : "#F8F9FB",
          borderWidth: error ? 2 : 1.5,
          borderColor: error ? "#E53E3E" : "#E8EDF5",
          shadowColor: error ? "#E53E3E" : "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: error ? 0.1 : 0.02,
          shadowRadius: 4,
          elevation: error ? 2 : 1,
        }}
      >
        <Ionicons
          name="calendar-outline"
          size={19}
          color={error ? "#E53E3E" : value ? "#0A4370" : "#A0A8B4"}
        />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 16,
              color: value ? "#1A202C" : "#A0A8B4",
              fontWeight: value ? "700" : "500",
              letterSpacing: value ? -0.2 : 0,
            }}
          >
            {value ? formatDisplay(value) : (placeholder ?? "Select a date")}
          </Text>
        </View>
        <View style={{ width: 19 }} />
      </TouchableOpacity>

      {!!error && (
        <View className="flex-row items-center gap-1.5 mt-1.5">
          <Ionicons name="alert-circle-outline" size={13} color="#E53E3E" />
          <Text className="text-[12px] text-danger font-semibold">{error}</Text>
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
