import { ErrorBoundary } from "@/src/components/errors/ErrorBoundary";
import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";

// TODO: replace with @react-native-community/datetimepicker on native when package is installed
// Using TextInput for all platforms as a safe fallback.

export interface TimeRangePickerProps {
  fromTime: string;
  toTime: string;
  onChange: (from: string, to: string) => void;
}

const TIME_PATTERN = /^\d{2}:\d{2}$/;

function TimeInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (val: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  // Keep draft in sync when parent value changes
  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  function handleBlur() {
    if (draft === "" || TIME_PATTERN.test(draft)) {
      onCommit(draft);
    } else {
      setDraft("");
      onCommit("");
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "800",
          color: "#6B7280",
          marginBottom: 6,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onBlur={handleBlur}
        placeholder="HH:mm"
        placeholderTextColor="#A0A8B4"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        style={{
          height: 44,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: "#E8EDF5",
          backgroundColor: "#F8F9FB",
          paddingHorizontal: 14,
          fontSize: 14,
          color: "#1A202C",
          fontWeight: "600",
        }}
      />
    </View>
  );
}

function TimeRangePickerInner({
  fromTime,
  toTime,
  onChange,
}: TimeRangePickerProps) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <TimeInput
        label="From"
        value={fromTime}
        onCommit={(val) => onChange(val, toTime)}
      />
      <TimeInput
        label="To"
        value={toTime}
        onCommit={(val) => onChange(fromTime, val)}
      />
    </View>
  );
}

export function TimeRangePicker(props: TimeRangePickerProps) {
  return (
    <ErrorBoundary>
      <TimeRangePickerInner {...props} />
    </ErrorBoundary>
  );
}
