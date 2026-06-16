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
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthButton } from "../../components/auth/AuthButton";
import { AuthInput } from "../../components/auth/AuthInput";
import { useAuth } from "../../hooks/useAuth";
import { validateLogin } from "../../utils/validation";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { login, isLoading, error, clearError, loginIdentifier, loginPassword: storeLoginPassword, pendingLoginPurpose, isAuthenticated } = useAuth();
  // Pre-filled from verify-phone redirect
  const { identifier: prefillIdentifier, password: prefillPassword } = useLocalSearchParams<{
    identifier?: string;
    password?: string;
  }>();

  // Use prefill params first, then store values
  const initialIdentifier = prefillIdentifier ?? loginIdentifier ?? "";
  const initialPassword = prefillPassword ?? storeLoginPassword ?? "";

  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState(initialPassword);
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

  const handleIdentifierChange = (text: string) => {
    setIdentifier(text);
    clearError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    clearError();
  };

  const cardY = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 320,
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
    return () => clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Redirect if authenticated
    if (isAuthenticated) {
      router.replace("/(tabs)");
    } 
    // Redirect if login requires verification or 2FA
    else if (pendingLoginPurpose) {
      if (pendingLoginPurpose === "verification") {
        router.replace("/auth/verify-login" as any);
      } else if (pendingLoginPurpose === "2fa") {
        router.replace("/auth/verify-2fa" as any);
      }
    }
  }, [isAuthenticated, pendingLoginPurpose, router]);

  const handleLogin = async () => {
    const errors = validateLogin(identifier, password);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      await login({ 
        identifier: identifier.trim(), 
        password, 
        user_type: "passenger", 
        device_name: "Mobile Device" 
      });
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
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          }}
        >
          <View style={styles.logoRing}>
            <RNImage
              source={require("../../../assets/images/icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>{t("common.appName")}</Text>
          <Text style={styles.brandTagline}>{t("auth.tagline")}</Text>
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
          <Text style={styles.title}>{t("auth.welcomeBack")}</Text>
          <Text style={styles.subtitle}>{t("auth.signInToContinue")}</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={Colors.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 20 }}>
            <AuthInput
              label={t("auth.emailOrPhone")}
              placeholder={t("auth.emailOrPhonePlaceholder")}
              value={identifier}
              onChangeText={handleIdentifierChange}
              error={fieldErrors.identifier}
              keyboardType="email-address"
              icon="person-outline"
              testID="login-identifier-input"
            />
            <AuthInput
              label={t("auth.password")}
              placeholder={t("auth.passwordPlaceholder")}
              value={password}
              onChangeText={handlePasswordChange}
              error={fieldErrors.password}
              isPassword
              icon="lock-closed-outline"
              testID="login-password-input"
            />
          </View>

          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => router.push("/auth/forgot-password")}
          >
            <Text style={styles.forgotText}>{t("auth.forgotPassword")}</Text>
          </TouchableOpacity>

          <AuthButton
            label={t("auth.signIn")}
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t("common.or")}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.noAccount")}</Text>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <Text style={styles.footerLink}>{t("auth.signUp")}</Text>
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
    height: 260,
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
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -30,
    right: -40,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoImage: {
    width: 62,
    height: 62,
    borderRadius: 16,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 0.5,
  },
  brandTagline: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  scroll: { flexGrow: 1 },
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    minHeight: 520,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.darkText,
    letterSpacing: 0.2,
  },
  subtitle: { fontSize: 14, color: Colors.secondaryText, marginTop: 4 },
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
  forgotRow: { alignSelf: "flex-end", marginBottom: 20, marginTop: 4 },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: Colors.secondaryText,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { fontSize: 14, color: Colors.secondaryText },
  footerLink: { fontSize: 14, color: Colors.primary, fontWeight: "700" },
});
