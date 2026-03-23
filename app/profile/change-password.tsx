import { changePassword } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;

  function validate() {
    const e: Record<string, string> = {};
    if (!current.trim()) e.current = "Current password is required";
    if (!next.trim()) e.next = "New password is required";
    else if (next.length < 8) e.next = "Password must be at least 8 characters";
    if (!confirm.trim()) e.confirm = "Please confirm your new password";
    else if (next !== confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await changePassword({ current_password: current, new_password: next });
      // Clear fields
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
      const msg = e instanceof Error ? e.message : "Failed to change password";
      setErrors({ submit: msg });
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
        <Text className="text-[22px] font-black text-white">
          Change Password
        </Text>
        <Text className="text-[13px] text-white/60 mt-1">
          Keep your account secure
        </Text>
      </View>

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
              Use a strong password with letters, numbers and symbols.
            </Text>
          </View>
          <PasswordField
            label="Current Password"
            value={current}
            onChangeText={setCurrent}
            error={errors.current}
            placeholder="Enter current password"
          />
          <PasswordField
            label="New Password"
            value={next}
            onChangeText={setNext}
            error={errors.next}
            placeholder="At least 8 characters"
          />
          <PasswordField
            label="Confirm New Password"
            value={confirm}
            onChangeText={setConfirm}
            error={errors.confirm}
            placeholder="Repeat new password"
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
            Password changed successfully
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
                Update Password
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
