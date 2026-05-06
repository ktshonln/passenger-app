import { AppBar } from "@/components/ui/app-bar";
import { useLanguage } from "@/src/hooks/useLanguage";
import { Locale } from "@/src/i18n";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function LanguageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { current, setLanguage, languages, meta } = useLanguage();
  const [saving, setSaving] = React.useState(false);

  async function handleSelect(code: Locale) {
    if (code === current) return;
    setSaving(true);
    await setLanguage(code);
    setSaving(false);
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      <AppBar
        title={t("language.title")}
        subtitle={t("language.selectLanguage")}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            shadowColor: "#0A4370",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 3,
          }}
        >
          {languages.map((code, i) => {
            const isSelected = current === code;
            const langMeta = meta[code];
            return (
              <TouchableOpacity
                key={code}
                testID={`language-option-${code}`}
                className={`flex-row items-center px-4 py-4 ${i < languages.length - 1 ? "border-b border-border" : ""}`}
                onPress={() => handleSelect(code)}
                activeOpacity={0.7}
              >
                {/* Badge */}
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isSelected ? "bg-primary" : "bg-overlay"}`}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: isSelected ? "#fff" : "#0A4370",
                      letterSpacing: 0.5,
                    }}
                  >
                    {langMeta.badge}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text
                    className={`text-[14px] font-semibold ${isSelected ? "text-primary" : "text-dark-text"}`}
                  >
                    {langMeta.label}
                  </Text>
                  <Text className="text-[12px] text-secondary-text mt-0.5">
                    {langMeta.native}
                  </Text>
                </View>

                {isSelected &&
                  (saving ? (
                    <ActivityIndicator size="small" color="#0A4370" />
                  ) : (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#0A4370"
                    />
                  ))}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
