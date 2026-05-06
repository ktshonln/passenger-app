import { AppBar } from "@/components/ui/app-bar";
import { useProfile } from "@/hooks/use-profile";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    View,
} from "react-native";

function PrefRow({
  icon,
  title,
  subtitle,
  value,
  onToggle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center px-4 py-4 border-b border-border">
      <View className="w-9 h-9 rounded-xl bg-overlay items-center justify-center mr-3">
        <Ionicons name={icon} size={18} color="#0A4370" />
      </View>
      <View className="flex-1 mr-3">
        <Text className="text-[14px] font-semibold text-dark-text">
          {title}
        </Text>
        <Text className="text-[12px] text-secondary-text mt-0.5">
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#E2E8F0", true: "rgba(10,67,112,0.4)" }}
        thumbColor={value ? "#0A4370" : "#fff"}
        ios_backgroundColor="#E2E8F0"
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, loading, load, update } = useProfile();
  const [sms, setSms] = useState(false);
  const [email, setEmail] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (profile) {
      setSms(profile.preferences.smsNotifications);
      setEmail(profile.preferences.emailNotifications);
    }
  }, [profile]);

  async function save(
    key: "smsNotifications" | "emailNotifications",
    val: boolean,
  ) {
    setSaving(true);
    try {
      await update({ preferences: { [key]: val } });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />
      <AppBar
        title={t("profile.notificationsTitle")}
        subtitle={t("profile.notificationsSubtitle")}
      />

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
            className="bg-white rounded-2xl overflow-hidden mb-3"
            style={{
              shadowColor: "#0A4370",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            <PrefRow
              icon="chatbubble-outline"
              title={t("profile.smsNotifications")}
              subtitle={t("profile.smsNotificationsDesc")}
              value={sms}
              onToggle={(v) => {
                setSms(v);
                save("smsNotifications", v);
              }}
            />
            <PrefRow
              icon="mail-outline"
              title={t("profile.emailNotifications")}
              subtitle={t("profile.emailNotificationsDesc")}
              value={email}
              onToggle={(v) => {
                setEmail(v);
                save("emailNotifications", v);
              }}
            />
          </View>
          {saving && (
            <View className="flex-row items-center gap-2 justify-center mt-2">
              <ActivityIndicator size="small" color="#0A4370" />
              <Text className="text-[12px] text-secondary-text">
                {t("profile.saving")}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
