import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AppBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightLabel?: string;
  onRight?: () => void;
}

export function AppBar({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightIcon,
  rightLabel,
  onRight,
}: AppBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  return (
    <View style={[S.root, { paddingTop: Platform.OS === "android" ? 48 : 56 }]}>
      {/* Left */}
      <View style={S.side}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            style={S.iconBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Center */}
      <View style={S.center}>
        <Text style={S.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={S.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right */}
      <View style={[S.side, { alignItems: "flex-end" }]}>
        {(rightIcon || rightLabel) && onRight ? (
          <TouchableOpacity
            onPress={onRight}
            style={S.iconBtn}
            activeOpacity={0.7}
          >
            {rightIcon && <Ionicons name={rightIcon} size={20} color="#fff" />}
            {rightLabel && <Text style={S.rightLabel}>{rightLabel}</Text>}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  root: {
    backgroundColor: "#0A4370",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  side: { width: 44 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: 0.1 },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 1 },
  rightLabel: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
