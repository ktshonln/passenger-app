import { useProfile } from "@/hooks/use-profile";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TouchableOpacity,
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

  function handleSms(val: boolean) {
    setSms(val);
    save("smsNotifications", val);
  }
  function handleEmail(val: boolean) {
    setEmail(val);
    save("emailNotifications", val);
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
        <Text className="text-[22px] font-black text-white">Notifications</Text>
        <Text className="text-[13px] text-white/60 mt-1">
          Choose what you hear about
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
              title="SMS Notifications"
              subtitle="Ticket alerts and booking updates"
              value={sms}
              onToggle={handleSms}
            />
            <PrefRow
              icon="mail-outline"
              title="Email Notifications"
              subtitle="Promotions and account updates"
              value={email}
              onToggle={handleEmail}
            />
          </View>

          {saving && (
            <View className="flex-row items-center gap-2 justify-center mt-2">
              <ActivityIndicator size="small" color="#0A4370" />
              <Text className="text-[12px] text-secondary-text">Saving...</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
