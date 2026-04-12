import { Colors } from "@/constants/colors";
import { useLanguage } from "@/src/hooks/useLanguage";
import { Locale } from "@/src/i18n";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ErrorScreen } from "../../components/errors/ErrorScreen";

function LangSwitcher() {
  const { current, setLanguage, languages, meta } = useLanguage();
  return (
    <View style={styles.langRow}>
      {languages.map((code: Locale) => {
        const active = code === current;
        return (
          <TouchableOpacity
            key={code}
            style={[styles.langBtn, active && styles.langBtnActive]}
            onPress={() => setLanguage(code)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.langBtnText, active && styles.langBtnTextActive]}
            >
              {meta[code].badge}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1 }}>
      <ErrorScreen
        testID="not-found-screen"
        icon="bus-outline"
        badge={t("errors.notFoundBadge")}
        title={t("errors.notFoundTitle")}
        subtitle={t("errors.notFoundSubtitle")}
        actionLabel={t("errors.notFoundAction")}
        onAction={() => router.replace("/(tabs)")}
        secondaryLabel={t("common.back")}
        onSecondary={() => router.back()}
      />
      {/* Language switcher at the bottom */}
      <View style={styles.langContainer}>
        <Ionicons
          name="language-outline"
          size={14}
          color={Colors.secondaryText}
        />
        <LangSwitcher />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  langContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  langRow: {
    flexDirection: "row",
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  langBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.secondaryText,
    letterSpacing: 0.5,
  },
  langBtnTextActive: {
    color: Colors.white,
  },
});
