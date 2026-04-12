import { useProfile } from "@/hooks/use-profile";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

function Field({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType = "default",
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  editable?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-[11px] font-bold text-secondary-text mb-1.5 tracking-widest uppercase">
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 12,
          height: 52,
          paddingHorizontal: 14,
          backgroundColor: !editable ? "#F3F4F6" : focused ? "#fff" : "#F8F9FB",
          borderWidth: error ? 1.5 : 1,
          borderColor: error ? "#E53E3E" : focused ? "#0A4370" : "#E2E8F0",
        }}
      >
        <TextInput
          style={{
            flex: 1,
            fontSize: 15,
            color: editable ? "#1A202C" : "#6A717D",
          }}
          placeholder={placeholder}
          placeholderTextColor="#A0A8B4"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          autoCorrect={false}
          editable={editable}
        />
      </View>
      {!!error && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
          }}
        >
          <Ionicons name="alert-circle-outline" size={12} color="#E53E3E" />
          <Text style={{ fontSize: 11, color: "#E53E3E" }}>{error}</Text>
        </View>
      )}
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, loading, load, update } = useProfile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setEmail(profile.email);
    }
  }, [profile]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("profile.nameRequired");
    if (!phone.trim()) e.phone = t("profile.phoneRequired");
    if (!email.trim()) e.email = t("profile.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = t("profile.invalidEmail");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    const payload: Record<string, string> = {};
    if (name.trim() !== profile?.name) payload.name = name.trim();
    if (phone.trim() !== profile?.phone) payload.phone = phone.trim();
    if (email.trim() !== profile?.email) payload.email = email.trim();
    if (Object.keys(payload).length === 0) {
      router.back();
      return;
    }
    setSaving(true);
    try {
      await update(payload);
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => router.back());
    } catch {
      setErrors({ submit: t("profile.failedToSave") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
          <Text className="text-[13px] text-white/70 font-medium">
            {t("common.back")}
          </Text>
        </TouchableOpacity>
        <Text className="text-[22px] font-black text-white">
          {t("profile.editProfile")}
        </Text>
        <Text className="text-[13px] text-white/60 mt-1">
          {t("profile.updateInfo")}
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center py-5">
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#0A4370",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>
                {name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "?"}
              </Text>
            </View>
            <TouchableOpacity
              className="mt-2 flex-row items-center gap-1"
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={14} color="#0A4370" />
              <Text className="text-[12px] text-primary font-semibold">
                {t("profile.changePhoto")}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            className="bg-white rounded-2xl p-4 mb-4"
            style={{
              shadowColor: "#0A4370",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 3,
            }}
          >
            <Text className="text-[11px] font-black text-secondary-text tracking-widest uppercase mb-4">
              {t("profile.personalInfo")}
            </Text>
            <Field
              label={t("profile.fullName")}
              value={name}
              onChangeText={setName}
              error={errors.name}
              placeholder={t("profile.fullNamePlaceholder")}
            />
            <Field
              label={t("profile.phoneNumber")}
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              placeholder={t("profile.phonePlaceholder")}
              keyboardType="phone-pad"
            />
            <Field
              label={t("profile.emailAddress")}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder={t("profile.emailPlaceholder")}
              keyboardType="email-address"
            />
          </View>

          {!!errors.submit && (
            <View className="flex-row items-center gap-2 bg-red-50 border border-danger rounded-xl p-3 mb-4">
              <Ionicons name="alert-circle-outline" size={16} color="#E53E3E" />
              <Text className="text-[13px] text-danger flex-1">
                {errors.submit}
              </Text>
            </View>
          )}

          <Animated.View
            style={{
              opacity: successAnim,
              transform: [{ scale: successAnim }],
            }}
            className="flex-row items-center gap-2 bg-green-50 border border-success rounded-xl p-3 mb-4"
          >
            <Ionicons name="checkmark-circle" size={16} color="#38A169" />
            <Text className="text-[13px] text-success font-semibold">
              {t("profile.profileUpdated")}
            </Text>
          </Animated.View>

          <TouchableOpacity
            className={`bg-primary rounded-2xl h-[54px] items-center justify-center ${saving ? "opacity-70" : ""}`}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="checkmark-outline" size={18} color="#fff" />
                <Text className="text-white text-[15px] font-bold">
                  {t("profile.saveChanges")}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
