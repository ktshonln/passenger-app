import { useProfile } from "@/hooks/use-profile";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function Avatar({
  name,
  avatar,
  size = 72,
}: {
  name: string;
  avatar?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#0A4370",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.33, fontWeight: "700" }}>
        {initials}
      </Text>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="bg-white rounded-2xl mb-3 overflow-hidden"
      style={{
        shadowColor: "#0A4370",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      {children}
    </View>
  );
}

function RowItem({
  icon,
  label,
  value,
  onPress,
  danger,
  hideChevron,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  hideChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3.5 border-b border-border last:border-0"
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <View className="w-8 h-8 rounded-xl bg-overlay items-center justify-center mr-3">
        <Ionicons
          name={icon}
          size={16}
          color={danger ? "#E53E3E" : "#0A4370"}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-[14px] font-semibold ${danger ? "text-danger" : "text-dark-text"}`}
        >
          {label}
        </Text>
        {!!value && (
          <Text className="text-[12px] text-secondary-text mt-0.5">
            {value}
          </Text>
        )}
      </View>
      {!hideChevron && onPress && (
        <Ionicons name="chevron-forward" size={16} color="#C8CDD6" />
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-[11px] font-black text-secondary-text tracking-widest uppercase mb-2 ml-1">
      {title}
    </Text>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, loading, error, load } = useProfile();
  const logout = useAuthStore((s) => s.logout);
  const logoutAll = useAuthStore((s) => s.logoutAll);
  const isLoading = useAuthStore((s) => s.isLoading);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      load().then(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
      return () => fadeAnim.setValue(0);
    }, [load, fadeAnim]),
  );

  function nav(path: string) {
    router.push(path as never);
  }

  const LANG_LABELS: Record<string, string> = {
    en: "English",
    fr: "French",
    rw: "Kinyarwanda",
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      {/* Header */}
      <View
        className="bg-primary px-5 pb-6"
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60 }}
      >
        <Text className="text-[26px] font-black text-white">Profile</Text>
        <Text className="text-[13px] text-white/60 mt-1">
          Manage your account
        </Text>
      </View>

      {loading && !profile ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#0A4370" />
          <Text className="text-[13px] text-secondary-text">
            Loading profile...
          </Text>
        </View>
      ) : error && !profile ? (
        <View className="flex-1 items-center justify-center gap-3 px-10">
          <Ionicons name="cloud-offline-outline" size={40} color="#6A717D" />
          <Text className="text-[15px] font-bold text-dark-text text-center">
            {error}
          </Text>
          <TouchableOpacity
            className="bg-primary px-7 py-3 rounded-xl"
            onPress={load}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-sm">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          className="flex-1"
          contentContainerClassName="p-4 pb-12"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile card */}
          <SectionCard>
            <View className="flex-row items-center px-4 py-4 gap-4">
              <Avatar
                name={profile?.name ?? "?"}
                avatar={profile?.avatar}
                size={64}
              />
              <View className="flex-1">
                <Text className="text-[17px] font-black text-dark-text">
                  {profile?.name}
                </Text>
                <Text className="text-[13px] text-secondary-text mt-0.5">
                  {profile?.phone}
                </Text>
                <Text className="text-[12px] text-secondary-text">
                  {profile?.email}
                </Text>
              </View>
              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-overlay items-center justify-center"
                onPress={() => nav("/profile/edit")}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={16} color="#0A4370" />
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* Account */}
          <SectionHeader title="Account" />
          <SectionCard>
            <RowItem
              icon="person-outline"
              label="Edit Profile"
              onPress={() => nav("/profile/edit")}
            />
            <RowItem
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => nav("/profile/change-password")}
            />
          </SectionCard>

          {/* Preferences */}
          <SectionHeader title="Preferences" />
          <SectionCard>
            <RowItem
              icon="notifications-outline"
              label="Notifications"
              value={
                [
                  profile?.preferences.smsNotifications ? "SMS" : null,
                  profile?.preferences.emailNotifications ? "Email" : null,
                ]
                  .filter(Boolean)
                  .join(", ") || "Off"
              }
              onPress={() => nav("/profile/notifications")}
            />
            <RowItem
              icon="language-outline"
              label="Language"
              value={LANG_LABELS[profile?.preferences.language ?? "en"]}
              onPress={() => nav("/profile/language")}
            />
          </SectionCard>

          {/* Danger zone */}
          <SectionHeader title="Account Actions" />
          <SectionCard>
            <RowItem
              icon="log-out-outline"
              label={isLoading ? "Signing out…" : "Sign Out"}
              danger
              hideChevron={isLoading}
              onPress={() => {
                Alert.alert("Sign Out", "Sign out of this device?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: () => logout(),
                  },
                ]);
              }}
            />
            <RowItem
              icon="phone-portrait-outline"
              label="Sign Out All Devices"
              danger
              hideChevron
              onPress={() => {
                Alert.alert(
                  "Sign Out Everywhere",
                  "This will end all active sessions across every device. Continue?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Sign Out All",
                      style: "destructive",
                      onPress: () => logoutAll(),
                    },
                  ],
                );
              }}
            />
          </SectionCard>
        </Animated.ScrollView>
      )}
    </View>
  );
}
