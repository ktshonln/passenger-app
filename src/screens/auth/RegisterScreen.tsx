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
import { validateRegister } from "../../utils/validation";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    password?: string;
    email?: string;
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

  const handleRegister = async () => {
    const errors = validateRegister({
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      password,
      email: email.trim() || undefined,
    });
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phone.trim(),
        password,
        email: email.trim() || undefined,
      });
      // register() sets pendingUserId in store → navigate to OTP screen
      router.push("/auth/verify-phone");
    } catch {
      /* error lives in store */
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          }}
        >
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="person-add" size={28} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.brandName}>Join Katisha</Text>
          <Text style={styles.brandTagline}>Book trips across East Africa</Text>
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>
            Fill in your details to get started
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={Colors.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 20 }}>
            {/* Name row */}
            <View style={styles.row}>
              <View style={styles.half}>
                <AuthInput
                  label="First Name"
                  placeholder="Jane"
                  value={firstName}
                  onChangeText={setFirstName}
                  error={fieldErrors.first_name}
                  autoCapitalize="words"
                  icon="person-outline"
                  testID="register-first-name-input"
                />
              </View>
              <View style={styles.half}>
                <AuthInput
                  label="Last Name"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  error={fieldErrors.last_name}
                  autoCapitalize="words"
                  testID="register-last-name-input"
                />
              </View>
            </View>

            <AuthInput
              label="Phone Number"
              placeholder="+250788000000"
              value={phone}
              onChangeText={setPhone}
              error={fieldErrors.phone_number}
              keyboardType="phone-pad"
              icon="call-outline"
              testID="register-phone-input"
            />

            <AuthInput
              label="Email (optional)"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              error={fieldErrors.email}
              keyboardType="email-address"
              icon="mail-outline"
              testID="register-email-input"
            />

            <AuthInput
              label="Password"
              placeholder="Min. 8 chars with a letter and number"
              value={password}
              onChangeText={setPassword}
              error={fieldErrors.password}
              isPassword
              icon="lock-closed-outline"
              testID="register-password-input"
            />
          </View>

          {/* Password strength hint */}
          <View style={styles.hint}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={Colors.secondaryText}
            />
            <Text style={styles.hintText}>
              Min 8 characters · at least 1 letter + 1 number
            </Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <AuthButton
              label="Continue"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          <Text style={styles.terms}>
            By continuing you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.footerLink}>Sign In</Text>
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
  circle3: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 10,
    left: -20,
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 24,
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
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    minHeight: 600,
  },
  title: { fontSize: 22, fontWeight: "800", color: Colors.darkText },
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
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  hintText: { fontSize: 12, color: Colors.secondaryText, flex: 1 },
  terms: {
    fontSize: 12,
    color: Colors.secondaryText,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 18,
  },
  termsLink: { color: Colors.primary, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 18 },
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
