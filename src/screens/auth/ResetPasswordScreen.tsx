import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AuthButton } from "../../components/auth/AuthButton";
import { AuthInput } from "../../components/auth/AuthInput";
import { useResetPassword } from "../../hooks/useResetPassword";
import { forgotPasswordRequest } from "../../services/auth.service";
import { isStrongPassword } from "../../utils/validation";

const { width } = Dimensions.get("window");

// ─── Resend OTP row ───────────────────────────────────────────────────────────
function ResendOtpRow({ identifier }: { identifier: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      await forgotPasswordRequest({ identifier });
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to resend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ alignItems: "center", marginTop: 16 }}>
      {sent ? (
        <Text style={{ fontSize: 13, color: "#38A169", fontWeight: "600" }}>
          ✓ New code sent
        </Text>
      ) : (
        <TouchableOpacity onPress={handleResend} disabled={loading}>
          <Text
            style={{
              fontSize: 13,
              color: loading ? "#A0A8B4" : "#0A4370",
              fontWeight: "600",
            }}
          >
            {loading ? t("common.loading") : t("auth.resendCode")}
          </Text>
        </TouchableOpacity>
      )}
      {!!error && (
        <Text style={{ fontSize: 12, color: "#E53E3E", marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  // identifier comes from forgot-password redirect; otp is entered by the user
  const { identifier } = useLocalSearchParams<{ identifier?: string }>();
  const { isLoading, error, done, resetPassword, clearError } =
    useResetPassword();

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const headerScale = useRef(new Animated.Value(0.75)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(headerScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 5,
        }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!done) return;
    Animated.sequence([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(successScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 12,
        }),
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!otp.trim() || otp.trim().length < 6)
      errs.otp = "Enter the 6-digit OTP from your SMS or email.";
    if (!newPassword)
      errs.newPassword =
        t("auth.newPasswordRequired") ?? "New password is required.";
    else if (!isStrongPassword(newPassword))
      errs.newPassword = t("auth.passwordHint");
    if (!confirmPassword)
      errs.confirmPassword = t("profile.confirmPasswordRequired");
    else if (newPassword !== confirmPassword)
      errs.confirmPassword = t("profile.passwordsDoNotMatch");
    return errs;
  };

  const handleSubmit = async () => {
    clearError();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    if (!identifier) {
      setFieldErrors({ otp: t("auth.noTokenFound") });
      return;
    }
    await resetPassword(otp.trim(), identifier, newPassword);
  };

  const rules = [
    { label: t("auth.atLeast8Chars"), ok: newPassword.length >= 8 },
    { label: t("auth.atLeast1Letter"), ok: /[a-zA-Z]/.test(newPassword) },
    { label: t("auth.atLeast1Number"), ok: /[0-9]/.test(newPassword) },
    {
      label: t("auth.passwordsMatch"),
      ok: !!confirmPassword && newPassword === confirmPassword,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        {!done && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <View style={styles.backBtnInner}>
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </View>
          </TouchableOpacity>
        )}
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ scale: headerScale }],
            opacity: headerOpacity,
          }}
        >
          <View style={styles.iconRing}>
            <View style={styles.iconInner}>
              <Ionicons
                name={done ? "checkmark-circle" : "lock-open"}
                size={28}
                color={done ? Colors.success : Colors.primary}
              />
            </View>
          </View>
          <Text style={styles.headerTitle}>
            {done ? t("auth.allDone") : t("auth.newPassword")}
          </Text>
          <Text style={styles.headerSub}>
            {done
              ? t("auth.passwordHasBeenUpdated")
              : t("auth.chooseStrongPassword")}
          </Text>
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!done && (
          <Animated.View
            style={[
              styles.card,
              { opacity: cardOpacity, transform: [{ translateY: cardY }] },
            ]}
          >
            <Text style={styles.title}>{t("auth.setNewPassword")}</Text>
            <Text style={styles.subtitle}>{t("auth.newPasswordSubtitle")}</Text>

            {(!otp.trim() || !identifier) && (
              <View style={styles.warnBanner}>
                <Ionicons name="warning-outline" size={16} color="#B45309" />
                <Text style={styles.warnText}>{t("auth.noTokenFound")}</Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={Colors.error}
                />
                <Text style={styles.errorBannerText}>{error}</Text>
                {error.includes("expired") && (
                  <TouchableOpacity
                    onPress={() => router.replace("/auth/forgot-password")}
                  >
                    <Text style={styles.errorAction}>
                      {t("auth.requestNewLink")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            <View style={{ marginTop: 20 }}>
              {/* OTP field — user enters the code received via SMS/email */}
              <AuthInput
                label="OTP Code"
                placeholder="Enter 6-digit code"
                value={otp}
                onChangeText={(v) => {
                  setOtp(v.replace(/\D/g, "").slice(0, 6));
                  setFieldErrors((e) => ({ ...e, otp: undefined }));
                }}
                error={fieldErrors.otp}
                keyboardType="number-pad"
                icon="keypad-outline"
                testID="reset-otp-input"
              />
              <AuthInput
                label={t("auth.newPassword")}
                placeholder={t("auth.newPasswordPlaceholder")}
                value={newPassword}
                onChangeText={(v) => {
                  setNewPassword(v);
                  setFieldErrors((e) => ({ ...e, newPassword: undefined }));
                }}
                error={fieldErrors.newPassword}
                isPassword
                icon="lock-closed-outline"
                testID="reset-new-password-input"
              />
              <AuthInput
                label={t("auth.confirmPassword")}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  setFieldErrors((e) => ({ ...e, confirmPassword: undefined }));
                }}
                error={fieldErrors.confirmPassword}
                isPassword
                icon="lock-closed-outline"
                testID="reset-confirm-password-input"
              />
            </View>

            <View style={styles.rulesBox}>
              {rules.map((rule) => (
                <View key={rule.label} style={styles.ruleRow}>
                  <Ionicons
                    name={rule.ok ? "checkmark-circle" : "ellipse-outline"}
                    size={15}
                    color={rule.ok ? Colors.success : Colors.secondaryText}
                  />
                  <Text style={[styles.ruleText, rule.ok && styles.ruleTextOk]}>
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: 8 }}>
              <AuthButton
                label={t("auth.updatePassword")}
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading || !otp.trim() || !identifier}
              />
            </View>

            {/* Resend OTP — calls forgot-password again to issue a fresh code */}
            {identifier && <ResendOtpRow identifier={identifier} />}
          </Animated.View>
        )}

        {done && (
          <Animated.View
            style={[
              styles.card,
              styles.successCard,
              { opacity: successOpacity, transform: [{ scale: successScale }] },
            ]}
          >
            <View style={styles.successIconWrap}>
              <View style={styles.successIconRing}>
                <Ionicons name="checkmark" size={36} color={Colors.white} />
              </View>
            </View>
            <Text style={styles.successTitle}>{t("auth.passwordUpdated")}</Text>
            <Text style={styles.successBody}>
              {t("auth.passwordUpdatedBody")}
            </Text>
            <View style={styles.securityNote}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={Colors.primary}
              />
              <Text style={styles.securityText}>
                {t("auth.allSessionsRevoked")}
              </Text>
            </View>
            <AuthButton
              label={t("auth.signInAgain")}
              onPress={() => router.replace("/auth/login")}
            />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  header: {
    height: 230,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -width * 0.85,
    alignSelf: "center",
  },
  circle2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -20,
    right: -30,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 36,
    left: 20,
  },
  backBtnInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 0.4,
  },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  scroll: { flexGrow: 1 },
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
    minHeight: 480,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.darkText,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: 6,
    lineHeight: 21,
  },
  warnBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  warnText: { flex: 1, fontSize: 13, color: "#92400E", lineHeight: 19 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    lineHeight: 19,
  },
  errorAction: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 6,
  },
  rulesBox: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    marginBottom: 8,
    gap: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ruleText: { fontSize: 13, color: Colors.secondaryText },
  ruleTextOk: { color: Colors.success, fontWeight: "600" },
  successCard: { alignItems: "center", paddingTop: 40 },
  successIconWrap: { marginBottom: 24 },
  successIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.darkText,
    marginBottom: 10,
  },
  successBody: {
    fontSize: 14,
    color: Colors.secondaryText,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 28,
    width: "100%",
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 19,
  },
});
