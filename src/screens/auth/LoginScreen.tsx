import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../../hooks/useAuth";
import { validateLogin } from "../../utils/validation";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

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

  const handleLogin = async () => {
    const errors = validateLogin(identifier, password);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      await login({ identifier: identifier.trim(), password });
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
      {/* ── Decorative header ── */}
      <View style={styles.header}>
        {/* Background circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          }}
        >
          {/* Logo mark */}
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="bus" size={30} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.brandName}>Katisha</Text>
          <Text style={styles.brandTagline}>Your journey starts here</Text>
        </Animated.View>
      </View>

      {/* ── Form card ── */}
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={Colors.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 20 }}>
            <AuthInput
              label="Email or Phone"
              placeholder="you@example.com or +254..."
              value={identifier}
              onChangeText={setIdentifier}
              error={fieldErrors.identifier}
              keyboardType="email-address"
              icon="person-outline"
              testID="login-identifier-input"
            />
            <AuthInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
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
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <AuthButton
            label="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  // ── Header ──
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
  logoInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    marginTop: 4,
  },
  // ── Card ──
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
  subtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: 4,
  },
  // ── Error ──
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
  // ── Forgot ──
  forgotRow: { alignSelf: "flex-end", marginBottom: 20, marginTop: 4 },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  // ── Divider ──
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: Colors.secondaryText,
  },
  // ── Footer ──
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: { fontSize: 14, color: Colors.secondaryText },
  footerLink: { fontSize: 14, color: Colors.primary, fontWeight: "700" },
});
