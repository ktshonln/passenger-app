import { AppBar } from "@/components/ui/app-bar";
import { useProfile } from "@/hooks/use-profile";
import { useWallet } from "@/src/hooks/use-wallet";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Animated,
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
  const { t } = useTranslation();
  const { profile, loading, load } = useProfile();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const logoutAll = useAuthStore((s) => s.logoutAll);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { balance } = useWallet();
  const fadeAnim = useRef(new Animated.Value(user ? 1 : 0)).current;

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      // Start animation immediately for smooth transition
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Refresh data in the background
      load().catch(() => {
        // Silent catch for background refresh
      });

      return () => {
        // Optionally reset if you want it to fade in every time
        // fadeAnim.setValue(0); 
      };
    }, [load, fadeAnim, user]),
  );

  // Fallback: use auth store user data when profile API hasn't loaded yet
  const displayName =
    profile?.name ?? (user ? `${user.first_name} ${user.last_name}` : "");
  const displayPhone = profile?.phone ?? user?.phone_number ?? "";
  const displayEmail = profile?.email ?? user?.email ?? "";

  function nav(path: string) {
    router.push(path as never);
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      <AppBar
        title={t("profile.title")}
        subtitle={t("profile.manageAccount")}
        showBack={false}
      />

      {/* Remove blocking loader to show cached data immediately */}
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
          <SectionCard>
            <View className="flex-row items-center px-4 py-4 gap-4">
              <Avatar
                name={displayName || "?"}
                avatar={profile?.avatar}
                size={64}
              />
              <View className="flex-1">
                <Text className="text-[17px] font-black text-dark-text">
                  {displayName}
                </Text>
                <Text className="text-[13px] text-secondary-text mt-0.5">
                  {displayPhone}
                </Text>
                {!!displayEmail && (
                  <Text className="text-[12px] text-secondary-text">
                    {displayEmail}
                  </Text>
                )}
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

          <SectionHeader title={t("profile.account")} />
          <SectionCard>
            <RowItem
              icon="wallet-outline"
              label="Wallet"
              value={`Balance: ${balance?.available != null ? `RWF ${balance.available.toLocaleString()}` : "—"}`}
              onPress={() => nav("/wallet")}
            />
            <RowItem
              icon="person-outline"
              label={t("profile.editProfile")}
              onPress={() => nav("/profile/edit")}
            />
            <RowItem
              icon="lock-closed-outline"
              label={t("profile.changePassword")}
              onPress={() => nav("/profile/change-password")}
            />
          </SectionCard>

          <SectionHeader title={t("profile.preferences")} />
          <SectionCard>
            <RowItem
              icon="notifications-outline"
              label={t("profile.notifications")}
              value={
                [
                  profile?.preferences?.smsNotifications
                    ? t("profile.sms")
                    : null,
                  profile?.preferences?.emailNotifications
                    ? t("profile.email")
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ") || t("common.off")
              }
              onPress={() => nav("/profile/notifications")}
            />
            <RowItem
              icon="language-outline"
              label={t("profile.language")}
              value={t(
                `language.${profile?.preferences?.language === "rw" ? "kinyarwanda" : profile?.preferences?.language === "fr" ? "french" : "english"}`,
              )}
              onPress={() => nav("/profile/language")}
            />
          </SectionCard>

          <SectionHeader title={t("profile.accountActions")} />
          <SectionCard>
            <RowItem
              icon="log-out-outline"
              label={isLoading ? t("profile.signingOut") : t("profile.signOut")}
              danger
              hideChevron={isLoading}
              onPress={() => {
                Alert.alert(
                  t("profile.signOutConfirmTitle"),
                  t("profile.signOutConfirmMsg"),
                  [
                    { text: t("common.cancel"), style: "cancel" },
                    {
                      text: t("profile.signOut"),
                      style: "destructive",
                      onPress: () => logout(),
                    },
                  ],
                );
              }}
            />
            <RowItem
              icon="phone-portrait-outline"
              label={t("profile.signOutAllDevices")}
              danger
              hideChevron
              onPress={() => {
                Alert.alert(
                  t("profile.signOutAllConfirmTitle"),
                  t("profile.signOutAllConfirmMsg"),
                  [
                    { text: t("common.cancel"), style: "cancel" },
                    {
                      text: t("profile.signOutAllBtn"),
                      style: "destructive",
                      onPress: () => logoutAll(),
                    },
                  ],
                );
              }}
            />
          </SectionCard>
        </Animated.ScrollView>
      </View>
    );
  }
