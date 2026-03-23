import { useProfile } from "@/hooks/use-profile";
import { UserPreferences } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const LANGUAGES: {
  code: UserPreferences["language"];
  label: string;
  native: string;
}[] = [
  { code: "en", label: "English", native: "English" },
  { code: "fr", label: "French", native: "Français" },
  { code: "rw", label: "Kinyarwanda", native: "Ikinyarwanda" },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { profile, loading, load, update } = useProfile();
  const [selected, setSelected] = useState<UserPreferences["language"]>("en");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (profile) setSelected(profile.preferences.language);
  }, [profile]);

  async function handleSelect(code: UserPreferences["language"]) {
    if (code === selected) return;
    setSelected(code);
    setSaving(true);
    try {
      await update({ preferences: { language: code } });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      <View
        className="bg-primary px-5 pb-5"
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1.5 mb-3"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
          <Text className="text-[13px] text-white/70 font-medium">Back</Text>
        </TouchableOpacity>
        <Text className="text-[22px] font-black text-white">Language</Text>
        <Text className="text-[13px] text-white/60 mt-1">
          Select your preferred language
        </Text>
      </View>

      {loading && !profile ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0A4370" />
        </View>
      ) : (
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
            {LANGUAGES.map((lang, i) => {
              const isSelected = selected === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  className={`flex-row items-center px-4 py-4 ${i < LANGUAGES.length - 1 ? "border-b border-border" : ""}`}
                  onPress={() => handleSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${isSelected ? "bg-primary" : "bg-overlay"}`}
                  >
                    <Ionicons
                      name="language-outline"
                      size={18}
                      color={isSelected ? "#fff" : "#0A4370"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-[14px] font-semibold ${isSelected ? "text-primary" : "text-dark-text"}`}
                    >
                      {lang.label}
                    </Text>
                    <Text className="text-[12px] text-secondary-text mt-0.5">
                      {lang.native}
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
      )}
    </View>
  );
}
