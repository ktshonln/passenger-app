import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { useForgotPassword } from "../../hooks/useForgotPassword";
import { isValidIdentifier } from "../../utils/validation";

const { width } = Dimensions.get("window");
const isPhone = (v: string) => /^\+?[0-9]{9,15}$/.test(v.trim());

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isLoading, error, sent, sentTo, sendOtp, reset } =
    useForgotPassword();

  const [identifier, setIdentifier] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();

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
    if (!sent || !sentTo) return;
    // Navigate to reset-password with identifier pre-filled
    // Small delay so the user sees the button loading state resolve
    const timer = setTimeout(() => {
      router.push({
        pathname: "/auth/reset-password" as never,
        params: { identifier: sentTo },
      });
      reset();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sent, sentTo]);

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      setFieldError(t("auth.emailOrPhone") + " is required.");
      return;
    }
    if (!isValidIdentifier(identifier.trim())) {
      setFieldError(
        "Enter a valid email or phone number (e.g. +250788000000).",
      );
      return;
    }
    setFieldError(undefined);
    await sendOtp(identifier.trim());
  };

  const handleResend = () => {
    reset();
    successOpacity.setValue(0);
    successScale.setValue(0);
    cardOpacity.setValue(1);
  };

  const viaPhone = isPhone(identifier);
  const channelHint = viaPhone ? t("auth.smsHint") : t("auth.emailHint");

  const successSteps = viaPhone
    ? [
        { icon: "phone-portrait-outline" as const, text: t("auth.smsStep1") },
        { icon: "keypad-outline" as const, text: t("auth.smsStep2") },
        {
          icon: "lock-open-outline" as const,
          text: t("auth.createNewPassword"),
        },
      ]
    : [
        { icon: "mail-open-outline" as const, text: t("auth.emailStep1") },
        { icon: "link-outline" as const, text: t("auth.emailStep2") },
        {
          icon: "lock-open-outline" as const,
          text: t("auth.createNewPassword"),
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
        <View style={styles.circle3} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <View style={styles.backBtnInner}>
            <Ionicons name="arrow-back" size={20} color={Colors.white} />
          </View>
        </TouchableOpacity>
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ scale: headerScale }],
            opacity: headerOpacity,
          }}
        >
          <View style={styles.iconRing}>
            <View style={styles.iconInner}>
              <Ionicons name="key" size={28} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.headerTitle}>{t("auth.resetPassword")}</Text>
          <Text style={styles.headerSub}>{t("auth.getYouBack")}</Text>
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!sent && (
          <Animated.View
            style={[
              styles.card,
              { opacity: cardOpacity, transform: [{ translateY: cardY }] },
            ]}
          >
            <Text style={styles.title}>{t("auth.forgotPasswordTitle")}</Text>
            <Text style={styles.subtitle}>
              {t("auth.forgotPasswordSubtitle")}
            </Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={Colors.error}
                />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.infoText}>{channelHint}</Text>
            </View>

            <View style={{ marginTop: 20 }}>
              <AuthInput
                label={t("auth.emailOrPhone")}
                placeholder={t("auth.emailOrPhonePlaceholder")}
                value={identifier}
                onChangeText={(v) => {
                  setIdentifier(v);
                  setFieldError(undefined);
                }}
                error={fieldError}
                keyboardType="email-address"
                icon="mail-outline"
                testID="forgot-identifier-input"
              />
            </View>

            <View style={{ marginTop: 8 }}>
              <AuthButton
                label={t("auth.sendResetLink")}
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t("auth.rememberPassword")}
              </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text style={styles.footerLink}>{t("auth.signIn")}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {sent && (
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

            <Text style={styles.successTitle}>
              {viaPhone ? t("auth.checkPhone") : t("auth.checkInbox")}
            </Text>
            <Text style={styles.successBody}>
              {viaPhone ? t("auth.sentCode") : t("auth.sentLink")}
              {"\n"}
              <Text style={styles.successIdentifier}>{identifier}</Text>
            </Text>

            <View style={styles.channelBadge}>
              <Ionicons
                name={viaPhone ? "chatbubble-outline" : "mail-open-outline"}
                size={15}
                color={Colors.primary}
              />
              <Text style={styles.channelBadgeText}>
                {viaPhone ? t("auth.deliveredSms") : t("auth.deliveredEmail")}
              </Text>
            </View>

            <View style={styles.successSteps}>
              {successSteps.map((item, i) => (
                <View key={i} style={styles.successStep}>
                  <View style={styles.successStepIcon}>
                    <Ionicons
                      name={item.icon}
                      size={16}
                      color={Colors.primary}
                    />
                  </View>
                  <Text style={styles.successStepText}>{item.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.ttlNote}>
              <Ionicons
                name="time-outline"
                size={14}
                color={Colors.secondaryText}
              />
              <Text style={styles.ttlText}>
                {viaPhone ? t("auth.codeExpires15") : t("auth.linkExpires1h")}
              </Text>
            </View>

            <AuthButton
              label={t("auth.backToSignIn")}
              onPress={() => router.replace("/auth/login")}
            />

            <TouchableOpacity style={styles.resendRow} onPress={handleResend}>
              <Text style={styles.resendText}>{t("auth.didntReceive")}</Text>
              <Text style={styles.resendLink}>{t("auth.resendCode")}</Text>
            </TouchableOpacity>
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
  circle3: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 10,
    left: -10,
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
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    gap: 8,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: Colors.error },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(10,67,112,0.06)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.primary, lineHeight: 19 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: { fontSize: 14, color: Colors.secondaryText },
  footerLink: { fontSize: 14, color: Colors.primary, fontWeight: "700" },
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
    marginBottom: 14,
  },
  successIdentifier: { color: Colors.primary, fontWeight: "700" },
  channelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.overlay,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 24,
  },
  channelBadgeText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  successSteps: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  successStep: { flexDirection: "row", alignItems: "center", gap: 12 },
  successStepIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  successStepText: { fontSize: 14, color: Colors.darkText, fontWeight: "500" },
  ttlNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  ttlText: { fontSize: 12, color: Colors.secondaryText },
  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  resendText: { fontSize: 14, color: Colors.secondaryText },
  resendLink: { fontSize: 14, color: Colors.primary, fontWeight: "700" },
});
