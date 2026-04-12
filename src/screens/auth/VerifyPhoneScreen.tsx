import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputKeyPressEventData,
    TouchableOpacity,
    View,
} from "react-native";
import { AuthButton } from "../../components/auth/AuthButton";
import { useAuth } from "../../hooks/useAuth";
import { validateOtp } from "../../utils/validation";

const { width } = Dimensions.get("window");
const OTP_LENGTH = 6;

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    verifyPhone,
    isLoading,
    error,
    clearError,
    pendingUserId,
    otpExpiresIn,
    clearPending,
  } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [secondsLeft, setSecondsLeft] = useState(otpExpiresIn ?? 300);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const cardY = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.75)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

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
    setTimeout(() => inputRefs.current[0]?.focus(), 500);
    return () => clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setFieldError(undefined);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const otp = digits.join("");
    const errors = validateOtp(otp);
    if (errors.otp) {
      setFieldError(errors.otp);
      return;
    }
    if (!pendingUserId) {
      setFieldError(t("auth.sessionExpired"));
      return;
    }
    try {
      await verifyPhone({ user_id: pendingUserId, otp });
      router.replace("/(tabs)");
    } catch {
      /* error lives in store */
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            clearPending();
            router.back();
          }}
        >
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
              <Ionicons
                name="phone-portrait"
                size={28}
                color={Colors.primary}
              />
            </View>
          </View>
          <Text style={styles.headerTitle}>{t("auth.verifyPhone")}</Text>
          <Text style={styles.headerSub}>{t("auth.oneStepAway")}</Text>
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.card,
            { opacity: cardOpacity, transform: [{ translateY: cardY }] },
          ]}
        >
          <Text style={styles.title}>{t("auth.enterCode")}</Text>
          <Text style={styles.subtitle}>
            {t("auth.codeSentSms")}
            {__DEV__ ? `\n${t("auth.checkConsole")}` : ""}
          </Text>

          {error || fieldError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={Colors.error} />
              <Text style={styles.errorBannerText}>{error ?? fieldError}</Text>
            </View>
          ) : null}

          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputRefs.current[i] = r;
                }}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                  error || fieldError ? styles.otpBoxError : null,
                ]}
                value={digit}
                onChangeText={(text) => handleDigitChange(text, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                testID={`otp-input-${i}`}
              />
            ))}
          </View>

          <View style={styles.timerRow}>
            {secondsLeft > 0 ? (
              <>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={Colors.secondaryText}
                />
                <Text style={styles.timerText}>
                  {t("auth.codeExpires")}
                  {formatTime(secondsLeft)}
                </Text>
              </>
            ) : (
              <Text style={[styles.timerText, { color: Colors.error }]}>
                {t("auth.codeExpired")}
              </Text>
            )}
          </View>

          <View style={{ marginTop: 8 }}>
            <AuthButton
              label={t("auth.verifyBtn")}
              onPress={handleVerify}
              loading={isLoading}
              disabled={isLoading || digits.join("").length < OTP_LENGTH}
            />
          </View>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>{t("auth.didntReceive")}</Text>
            <TouchableOpacity
              disabled={secondsLeft > 0}
              onPress={() => {
                setSecondsLeft(300);
                setDigits(Array(OTP_LENGTH).fill(""));
              }}
            >
              <Text
                style={[
                  styles.resendLink,
                  secondsLeft > 0 && { color: Colors.secondaryText },
                ]}
              >
                {t("auth.resendCode")}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  header: {
    height: 220,
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
    minHeight: 420,
  },
  title: { fontSize: 22, fontWeight: "800", color: Colors.darkText },
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
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 16,
  },
  otpBox: {
    width: (width - 56 - 40) / 6,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: Colors.darkText,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: "#F0F5FF" },
  otpBoxError: { borderColor: Colors.error },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
  },
  timerText: { fontSize: 13, color: Colors.secondaryText },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  resendText: { fontSize: 14, color: Colors.secondaryText },
  resendLink: { fontSize: 14, color: Colors.primary, fontWeight: "700" },
});
