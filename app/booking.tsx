import { AppBar } from "@/components/ui/app-bar";
import { useWallet } from "@/src/hooks/use-wallet";
import {
  bookTicket,
  createPaymentSSE,
  type PaymentStatus,
} from "@/src/services/trip.service";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "details" | "password" | "payment";
type PayMethod = "momo" | "airtel" | "card" | "wallet" | null;

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ step }: { step: Step }) {
  const steps: Step[] = ["details", "password", "payment"];
  const idx = steps.indexOf(step);
  return (
    <View style={S.stepBar}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={[S.stepDot, i <= idx && S.stepDotActive]}>
            {i < idx ? (
              <Ionicons name="checkmark" size={11} color="#fff" />
            ) : (
              <Text style={S.stepDotText}>{i + 1}</Text>
            )}
          </View>
          {i < steps.length - 1 && (
            <View style={[S.stepLine, i < idx && S.stepLineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType = "default",
  icon,
  secureTextEntry = false,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
  icon: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <View style={S.fieldWrap}>
      <Text style={S.fieldLabel}>{label}</Text>
      <View
        style={[
          S.fieldBox,
          focused && S.fieldBoxFocused,
          !!error && S.fieldBoxError,
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={focused ? "#0A4370" : "#A0A8B4"}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={S.fieldInput}
          placeholder={placeholder}
          placeholderTextColor="#A0A8B4"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          autoCorrect={false}
          secureTextEntry={secureTextEntry && !shown}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShown(!shown)} hitSlop={8}>
            <Ionicons
              name={shown ? "eye-off-outline" : "eye-outline"}
              size={17}
              color="#A0A8B4"
            />
          </TouchableOpacity>
        )}
      </View>
      {!!hint && !error && <Text style={S.fieldHint}>{hint}</Text>}
      {!!error && (
        <View style={S.fieldError}>
          <Ionicons name="alert-circle-outline" size={12} color="#E53E3E" />
          <Text style={S.fieldErrorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={S.card}>
      {title && (
        <View style={S.cardHeader}>
          <Text style={S.cardTitle}>{title}</Text>
        </View>
      )}
      <View style={S.cardBody}>{children}</View>
    </View>
  );
}

// ─── Trip summary row ─────────────────────────────────────────────────────────

function TripSummary({
  trip,
  total,
  t,
}: {
  trip: Trip;
  total: number;
  t: (k: string) => string;
}) {
  function fmt(iso: string) {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return (
    <Card title={t("booking.tripSummary")}>
      <View style={S.tripRow}>
        <View style={{ flex: 1 }}>
          <Text style={S.tripTime}>{fmt(trip.departureTime)}</Text>
          <Text style={S.tripCity}>{trip.from?.city}</Text>
        </View>
        <View style={S.tripMid}>
          <Ionicons name="arrow-forward" size={16} color="#6A717D" />
          <Text style={S.tripDuration}>{trip.duration}</Text>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text style={S.tripTime}>{fmt(trip.arrivalTime)}</Text>
          <Text style={S.tripCity}>{trip.to?.city}</Text>
        </View>
      </View>
      <View style={S.divider} />
      <View style={S.tripFooter}>
        <Text style={S.tripOperator}>
          {trip.operator} · {trip.busType}
        </Text>
        <Text style={S.tripTotal}>
          {trip.currency} {total.toLocaleString()}
        </Text>
      </View>
    </Card>
  );
}

// ─── Payment method option ────────────────────────────────────────────────────

function PayOption({
  id,
  logo,
  title,
  desc,
  selected,
  onSelect,
  color,
}: {
  id: PayMethod;
  logo: string;
  title: string;
  desc: string;
  selected: boolean;
  onSelect: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={[
        S.payOption,
        selected && { borderColor: color, backgroundColor: color + "0D" },
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={[S.payLogo, { backgroundColor: color + "18" }]}>
        <Text style={{ fontSize: 22 }}>{logo}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[S.payTitle, selected && { color }]}>{title}</Text>
        <Text style={S.payDesc}>{desc}</Text>
      </View>
      <View style={[S.payRadio, selected && { borderColor: color }]}>
        {selected && (
          <View style={[S.payRadioInner, { backgroundColor: color }]} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function BookingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ trip: string }>();
  const trip = JSON.parse(params.trip ?? "{}");
  const { token, user, isAuthenticated } = useAuthStore();
  const { balance: walletBalance, refetch: refetchWallet } = useWallet();

  const [sudoToken, setSudoToken] = useState<string | null>(null);

  // Step state
  const [step, setStep] = useState<Step>("details");
  const slideAnim = useRef(new Animated.Value(0)).current;

  function animateNext() {
    slideAnim.setValue(40);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }

  // Step 1 — passenger details
  const [fullName, setFullName] = useState(
    user ? `${user.first_name} ${user.last_name}` : "",
  );
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});

  // Step 2 — password
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Step 3 — payment
  const [payMethod, setPayMethod] = useState<PayMethod>(null);
  const [momoNumber, setMomoNumber] = useState(user?.phone_number ?? "");
  const [airtelNumber, setAirtelNumber] = useState(user?.phone_number ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState(
    user ? `${user.first_name} ${user.last_name}` : "",
  );
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null,
  );

  const total = (trip.price ?? 0) + 50;

  // Step 1 submit
  function submitDetails() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = t("profile.nameRequired");
    if (!phone.trim()) e.phone = t("profile.phoneRequired");
    if (!email.trim()) e.email = t("profile.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = t("profile.invalidEmail");
    setDetailErrors(e);
    if (Object.keys(e).length) return;
    setStep("password");
    animateNext();
  }

  // Step 2 submit
  async function submitPassword() {
    if (!password) {
      setPwError(t("auth.passwordPlaceholder"));
      return;
    }
    setPwLoading(true);
    setPwError("");
    try {
      if (token) {
        const result = await useAuthStore.getState().verifyPassword(password);
        if (result) {
          setSudoToken(result);
          setStep("payment");
          animateNext();
        } else {
          setPwError(t("booking.passwordIncorrect"));
        }
      }
    } catch (error) {
      setPwError(t("booking.passwordIncorrect"));
    } finally {
      setPwLoading(false);
    }
  }

  // Step 3 submit
  async function submitPayment() {
    if (!payMethod) {
      setPayError(t("booking.choosePayment"));
      return;
    }
    if (
      payMethod === "wallet" &&
      walletBalance &&
      walletBalance.available < total
    ) {
      setPayError(t("booking.insufficientFunds"));
      return;
    }
    setPayLoading(true);
    setPayError("");
    try {
      // Get trip details for boarding/alighting stops
      const boardingStopId = trip.from?.id;
      const alightingStopId = trip.to?.id;

      if (!boardingStopId || !alightingStopId) {
        throw new Error("Missing stop information");
      }

      const ticketResponse = await bookTicket(
        {
          trip_id: trip.id,
          boarding_stop_id: boardingStopId,
          alighting_stop_id: alightingStopId,
          seats_count: 1,
          payment_method: payMethod as any,
          passenger_name: fullName,
        },
        token,
        sudoToken || undefined,
      );

      setCurrentTicketId(ticketResponse.ticket_id);

      // Set up SSE listener
      const handleMessage = async (data: PaymentStatus) => {
        console.log("SSE Message received:", data);
        setPaymentStatus(data);
        if (data.status === "confirmed") {
          console.log("Payment confirmed, refetching wallet balance...");
          await refetchWallet();
          console.log("Wallet balance refetch complete");
          // Create a booking object for the success screen
          const booking = {
            id: data.ticket?.id || ticketResponse.ticket_id,
            bookingRef: data.ticket?.id || ticketResponse.ticket_id,
            seatNumber: "1",
            trip,
            passenger: {
              fullName,
              phone,
              email,
            },
            currency: trip.currency || "RWF",
            totalPaid: total,
            bookedAt: new Date().toISOString(),
          };
          router.replace({
            pathname: "/booking-success" as never,
            params: { booking: JSON.stringify(booking) },
          });
        } else if (
          data.status === "failed" ||
          data.status === "expired" ||
          data.status === "timeout"
        ) {
          setPayError(data.message || t("booking.bookingFailed"));
        }
      };

      const handleError = (err: Error) => {
        setPayError(err.message);
      };

      createPaymentSSE(ticketResponse.ticket_id, handleMessage, handleError);
    } catch (error: any) {
      setPayError(error.message || t("booking.bookingFailed"));
    } finally {
      setPayLoading(false);
    }
  }

  const stepTitles: Record<Step, string> = {
    details: t("booking.passengerDetailsFix"),
    password: t("booking.confirmPassword"),
    payment: t("booking.choosePayment"),
  };
  const stepSubs: Record<Step, string> = {
    details: t("booking.completeBooking"),
    password: t("booking.confirmPasswordDesc"),
    payment: t("booking.choosePaymentDesc"),
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F3F4F6" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      {/* Header */}
      <AppBar
        title={stepTitles[step]}
        subtitle={stepSubs[step]}
        onBack={() =>
          step === "details"
            ? router.back()
            : setStep(step === "payment" ? "password" : "details")
        }
      />
      {/* Step progress */}
      <View
        style={{
          backgroundColor: "#0A4370",
          paddingHorizontal: 20,
          paddingBottom: 14,
        }}
      >
        <StepBar step={step} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          {/* ── STEP 1: Passenger details ── */}
          {step === "details" && (
            <>
              <TripSummary trip={trip} total={total} t={t} />

              <Card title={t("booking.passengerInfo")}>
                <Field
                  label={t("booking.fullName")}
                  placeholder={t("booking.fullNamePlaceholder")}
                  value={fullName}
                  onChangeText={setFullName}
                  error={detailErrors.fullName}
                  icon="person-outline"
                />
                <Field
                  label={t("booking.phoneNumber")}
                  placeholder="+250 788 000 000"
                  value={phone}
                  onChangeText={setPhone}
                  error={detailErrors.phone}
                  keyboardType="phone-pad"
                  icon="call-outline"
                />
                <Field
                  label={t("booking.emailAddress")}
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  error={detailErrors.email}
                  keyboardType="email-address"
                  icon="mail-outline"
                />
              </Card>

              <Card title={t("booking.priceBreakdown")}>
                <View style={S.priceRow}>
                  <Text style={S.priceLabel}>{t("booking.ticket")}</Text>
                  <Text style={S.priceValue}>
                    {trip.currency} {trip.price?.toLocaleString()}
                  </Text>
                </View>
                <View style={S.priceRow}>
                  <Text style={S.priceLabel}>{t("booking.serviceFee")}</Text>
                  <Text style={S.priceValue}>{trip.currency} 50</Text>
                </View>
                <View style={S.divider} />
                <View style={S.priceRow}>
                  <Text style={S.priceTotalLabel}>{t("booking.total")}</Text>
                  <Text style={S.priceTotalValue}>
                    {trip.currency} {total.toLocaleString()}
                  </Text>
                </View>
              </Card>

              <TouchableOpacity
                style={S.primaryBtn}
                onPress={submitDetails}
                activeOpacity={0.85}
              >
                <Text style={S.primaryBtnText}>{t("common.confirm")}</Text>
                <Ionicons name="arrow-forward" size={17} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP 2: Password confirmation ── */}
          {step === "password" && (
            <>
              <TripSummary trip={trip} total={total} t={t} />

              <Card>
                <View style={S.pwIconWrap}>
                  <View style={S.pwIcon}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={32}
                      color="#0A4370"
                    />
                  </View>
                  <Text style={S.pwTitle}>{t("booking.confirmPassword")}</Text>
                  <Text style={S.pwDesc}>
                    {t("booking.confirmPasswordDesc")}
                  </Text>
                </View>
                <Field
                  label={t("auth.password")}
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setPwError("");
                  }}
                  error={pwError}
                  icon="lock-closed-outline"
                  secureTextEntry
                />
              </Card>

              <TouchableOpacity
                style={[S.primaryBtn, pwLoading && S.primaryBtnDisabled]}
                onPress={submitPassword}
                disabled={pwLoading}
                activeOpacity={0.85}
              >
                {pwLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={17}
                      color="#fff"
                    />
                    <Text style={S.primaryBtnText}>{t("common.confirm")}</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP 3: Payment method ── */}
          {step === "payment" && (
            <>
              <TripSummary trip={trip} total={total} t={t} />

              <Card title={t("booking.choosePayment")}>
                {isAuthenticated && (
                  <PayOption
                    id="wallet"
                    logo="💳"
                    title={t("booking.walletTitle")}
                    desc={
                      walletBalance
                        ? `${t("booking.walletBalance")}: ${walletBalance.currency} ${walletBalance.available.toLocaleString()}`
                        : t("booking.walletLoading")
                    }
                    color="#0A4370"
                    selected={payMethod === "wallet"}
                    onSelect={() => setPayMethod("wallet")}
                  />
                )}
                <PayOption
                  id="momo"
                  logo="📱"
                  title={t("booking.momoTitle")}
                  desc={t("booking.momoDesc")}
                  color="#FFCC00"
                  selected={payMethod === "momo"}
                  onSelect={() => setPayMethod("momo")}
                />
                <View style={{ height: 10 }} />
                <PayOption
                  id="airtel"
                  logo="🔴"
                  title={t("booking.airtelTitle")}
                  desc={t("booking.airtelDesc")}
                  color="#E53E3E"
                  selected={payMethod === "airtel"}
                  onSelect={() => setPayMethod("airtel")}
                />
                <View style={{ height: 10 }} />
                <PayOption
                  id="card"
                  logo="💳"
                  title={t("booking.cardTitle")}
                  desc={t("booking.cardDesc")}
                  color="#0A4370"
                  selected={payMethod === "card"}
                  onSelect={() => setPayMethod("card")}
                />
              </Card>

              {/* MoMo number input */}
              {payMethod === "momo" && (
                <Card>
                  <Field
                    label={t("booking.enterMomoNumber")}
                    placeholder="+250 78 000 0000"
                    value={momoNumber}
                    onChangeText={setMomoNumber}
                    keyboardType="phone-pad"
                    icon="phone-portrait-outline"
                  />
                </Card>
              )}

              {/* Airtel number input */}
              {payMethod === "airtel" && (
                <Card>
                  <Field
                    label={t("booking.enterAirtelNumber")}
                    placeholder="+250 73 000 0000"
                    value={airtelNumber}
                    onChangeText={setAirtelNumber}
                    keyboardType="phone-pad"
                    icon="phone-portrait-outline"
                  />
                </Card>
              )}

              {/* Card inputs */}
              {payMethod === "card" && (
                <Card>
                  <Field
                    label={t("booking.cardHolder")}
                    placeholder="Jane Doe"
                    value={cardHolder}
                    onChangeText={setCardHolder}
                    icon="person-outline"
                  />
                  <Field
                    label={t("booking.cardNumber")}
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    keyboardType="numeric"
                    icon="card-outline"
                  />
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Field
                        label={t("booking.cardExpiry")}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                        keyboardType="numeric"
                        icon="calendar-outline"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field
                        label={t("booking.cardCvv")}
                        placeholder="123"
                        value={cardCvv}
                        onChangeText={setCardCvv}
                        keyboardType="numeric"
                        icon="lock-closed-outline"
                        secureTextEntry
                      />
                    </View>
                  </View>
                </Card>
              )}

              {!!payError && (
                <View style={S.errorBanner}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={15}
                    color="#E53E3E"
                  />
                  <Text style={S.errorBannerText}>{payError}</Text>
                </View>
              )}

              {/* Secure badge */}
              <View style={S.secureBadge}>
                <Ionicons name="lock-closed" size={12} color="#38A169" />
                <Text style={S.secureBadgeText}>
                  {t("booking.securePayment")}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  S.primaryBtn,
                  S.payBtn,
                  payLoading && S.primaryBtnDisabled,
                ]}
                onPress={submitPayment}
                disabled={payLoading}
                activeOpacity={0.85}
              >
                {payLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="lock-closed-outline"
                      size={17}
                      color="#fff"
                    />
                    <Text style={S.primaryBtnText}>
                      {t("booking.payNow")} · {trip.currency}{" "}
                      {total.toLocaleString()}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  header: {
    backgroundColor: "#0A4370",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  backText: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    marginTop: 3,
    marginBottom: 16,
  },

  // Step bar
  stepBar: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { backgroundColor: "#fff" },
  stepDotText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 4,
  },
  stepLineActive: { backgroundColor: "#fff" },

  scroll: { padding: 16, paddingBottom: 60 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#6A717D",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardBody: { padding: 16 },

  // Trip summary
  tripRow: { flexDirection: "row", alignItems: "center" },
  tripTime: { fontSize: 22, fontWeight: "900", color: "#1A202C" },
  tripCity: { fontSize: 12, color: "#6A717D", marginTop: 2 },
  tripMid: { alignItems: "center", paddingHorizontal: 12, gap: 2 },
  tripDuration: { fontSize: 11, color: "#A0A8B4" },
  tripFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripOperator: { fontSize: 12, color: "#6A717D" },
  tripTotal: { fontSize: 16, fontWeight: "900", color: "#0A4370" },
  divider: { height: 1, backgroundColor: "#F0F2F5", marginVertical: 12 },

  // Field
  fieldWrap: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6A717D",
    marginBottom: 6,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F8F9FB",
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  fieldBoxFocused: { borderColor: "#0A4370", backgroundColor: "#fff" },
  fieldBoxError: { borderColor: "#E53E3E", backgroundColor: "#FFF5F5" },
  fieldInput: { flex: 1, fontSize: 15, color: "#1A202C" },
  fieldHint: { fontSize: 11, color: "#A0A8B4", marginTop: 4 },
  fieldError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  fieldErrorText: { fontSize: 11, color: "#E53E3E" },

  // Price breakdown
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  priceLabel: { fontSize: 13, color: "#6A717D" },
  priceValue: { fontSize: 13, fontWeight: "600", color: "#1A202C" },
  priceTotalLabel: { fontSize: 15, fontWeight: "800", color: "#1A202C" },
  priceTotalValue: { fontSize: 18, fontWeight: "900", color: "#0A4370" },

  // Password step
  pwIconWrap: { alignItems: "center", paddingVertical: 8, marginBottom: 16 },
  pwIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  pwTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A202C",
    marginBottom: 6,
  },
  pwDesc: {
    fontSize: 13,
    color: "#6A717D",
    textAlign: "center",
    lineHeight: 20,
  },

  // Payment options
  payOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8F9FB",
  },
  payLogo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  payTitle: { fontSize: 14, fontWeight: "800", color: "#1A202C" },
  payDesc: { fontSize: 11, color: "#6A717D", marginTop: 2 },
  payRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
  },
  payRadioInner: { width: 10, height: 10, borderRadius: 5 },

  // Secure badge
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14,
  },
  secureBadgeText: { fontSize: 11, color: "#38A169", fontWeight: "600" },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: "#E53E3E" },

  // Buttons
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0A4370",
    borderRadius: 16,
    height: 56,
    marginBottom: 8,
  },
  primaryBtnDisabled: { opacity: 0.65 },
  primaryBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  payBtn: { backgroundColor: "#38A169" },
});
