import { AppBar } from "@/components/ui/app-bar";
import { changePassword } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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

function PasswordField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
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
          backgroundColor: focused ? "#fff" : "#F8F9FB",
          borderWidth: error ? 1.5 : 1,
          borderColor: error ? "#E53E3E" : focused ? "#0A4370" : "#E2E8F0",
        }}
      >
        <TextInput
          style={{ flex: 1, fontSize: 15, color: "#1A202C" }}
          placeholder={placeholder}
          placeholderTextColor="#A0A8B4"
          value={value}
          onChangeText={(t) => {
            if (!t) setVisible(false);
            onChangeText(t);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#A0A8B4"
            />
          </TouchableOpacity>
        )}
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

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;

  function validate() {
    const e: Record<string, string> = {};
    if (!current.trim()) e.current = t("profile.currentPasswordRequired");
    if (!next.trim()) e.next = t("profile.newPasswordRequired");
    else if (next.length < 8) e.next = t("profile.passwordMin8");
    if (!confirm.trim()) e.confirm = t("profile.confirmPasswordRequired");
    else if (next !== confirm) e.confirm = t("profile.passwordsDoNotMatch");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await changePassword({ current_password: current, new_password: next });
      setCurrent("");
      setNext("");
      setConfirm("");
      setErrors({});
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => router.back());
    } catch (e: unknown) {
      setErrors({
        submit: e instanceof Error ? e.message : t("common.unknownError"),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />
      <AppBar
        title={t("profile.changePasswordTitle")}
        subtitle={t("profile.keepAccountSecure")}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
          <View className="flex-row items-center gap-2 mb-4 p-3 bg-overlay rounded-xl">
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#0A4370"
            />
            <Text className="text-[12px] text-primary flex-1">
              {t("profile.strongPasswordTip")}
            </Text>
          </View>
          <PasswordField
            label={t("profile.currentPassword")}
            value={current}
            onChangeText={setCurrent}
            error={errors.current}
            placeholder={t("profile.currentPasswordPlaceholder")}
          />
          <PasswordField
            label={t("profile.newPasswordLabel")}
            value={next}
            onChangeText={setNext}
            error={errors.next}
            placeholder={t("profile.newPasswordPlaceholder")}
          />
          <PasswordField
            label={t("profile.confirmNewPassword")}
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
            placeholder={t("profile.confirmNewPasswordPlaceholder")}
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
          style={{ opacity: successAnim, transform: [{ scale: successAnim }] }}
          className="flex-row items-center gap-2 bg-green-50 border border-success rounded-xl p-3 mb-4"
        >
          <Ionicons name="checkmark-circle" size={16} color="#38A169" />
          <Text className="text-[13px] text-success font-semibold">
            {t("profile.passwordChangedSuccess")}
          </Text>
        </Animated.View>

        <TouchableOpacity
          className={`bg-primary rounded-2xl h-[54px] items-center justify-center ${loading ? "opacity-70" : ""}`}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Ionicons name="lock-closed-outline" size={17} color="#fff" />
              <Text className="text-white text-[15px] font-bold">
                {t("profile.updatePasswordBtn")}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
