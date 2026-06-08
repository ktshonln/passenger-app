import { useWallet } from "@/src/hooks/use-wallet";
import { useWalletTransactions } from "@/src/hooks/use-wallet-transactions";
import { useLanguage } from "@/src/hooks/useLanguage";
import {
  createTopupSSE,
  initiateTopup,
  type TopupSSEEvent,
  type WalletTransaction,
} from "@/src/services/wallet.service";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string, locale: string = "en-GB") {
  return new Date(iso).toLocaleDateString(locale === "rw" ? "rw-RW" : locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function maskPhone(p: string) {
  if (p.length < 10) return p;
  return `${p.slice(0, -6)}***${p.slice(-3)}`;
}
function fmtCountdown(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Bone({ w, h, r = 8 }: { w: number | string; h: number; r?: number }) {
  return (
    <View
      style={{
        width: w as any,
        height: h,
        borderRadius: r,
        backgroundColor: "#E8EDF5",
      }}
    />
  );
}

function WalletSkeleton() {
  const { t } = useTranslation();
  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />
      <View
        style={[S.header, { paddingTop: Platform.OS === "android" ? 48 : 60 }]}
      >
        <View style={S.hDecor1} />
        <View style={S.hDecor2} />
        <View style={S.hTop}>
          <View style={{ width: 40 }} />
          <Text style={[S.hTitle, { opacity: 0.5 }]}>{t("wallet.title")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ alignItems: "center", gap: 10, marginTop: 16 }}>
          <Bone w={60} h={12} r={4} />
          <Bone w={160} h={48} r={12} />
          <Bone w={80} h={14} r={4} />
          <Bone w={140} h={44} r={14} />
        </View>
      </View>
      <View style={S.sheet}>
        <View style={{ padding: 18, gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={S.txCard}>
              <Bone w={48} h={48} r={14} />
              <View style={{ flex: 1, gap: 6 }}>
                <Bone w="70%" h={13} r={4} />
                <Bone w="50%" h={11} r={4} />
              </View>
              <Bone w={70} h={13} r={4} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Transaction card ─────────────────────────────────────────────────────────

function TxCard({ tx }: { tx: WalletTransaction }) {
  const { t, i18n } = useTranslation();
  const up = tx.type === "topup";
  const sc =
    tx.status === "confirmed"
      ? "#38A169"
      : tx.status === "pending"
        ? "#D69E2E"
        : "#E53E3E";
  const sb =
    tx.status === "confirmed"
      ? "#F0FFF4"
      : tx.status === "pending"
        ? "#FFFFF0"
        : "#FFF5F5";
  return (
    <View style={[S.txCard, tx.status === "failed" && { opacity: 0.55 }]}>
      <View style={[S.txIcon, { backgroundColor: up ? "#F0FFF4" : "#FFF5F5" }]}>
        <Ionicons
          name={up ? "arrow-down-circle" : "arrow-up-circle"}
          size={24}
          color={up ? "#38A169" : "#E53E3E"}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={[
              S.typeBadge,
              { backgroundColor: up ? "#F0FFF4" : "#FFF5F5" },
            ]}
          >
            <Text style={[S.typeTxt, { color: up ? "#38A169" : "#E53E3E" }]}>
              {up ? t("wallet.topUp") : t("wallet.payment")}
            </Text>
          </View>
          <Text style={S.txDesc} numberOfLines={1}>
            {tx.description}
          </Text>
        </View>
        <Text style={S.txDate}>{fmtDate(tx.created_at, i18n.language)}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={[S.txAmt, { color: up ? "#38A169" : "#E53E3E" }]}>
          {up ? "+" : "-"}
          {tx.currency} {tx.amount.toLocaleString()}
        </Text>
        <View style={[S.statusBadge, { backgroundColor: sb }]}>
          <Text style={[S.statusTxt, { color: sc }]}>
            {t(`wallet.status.${tx.status}`, { defaultValue: tx.status })}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { current } = useLanguage();
  const { token, user } = useAuthStore();
  const { balance, loading: balLoading } = useWallet();

  const [filter, setFilter] = useState<"all" | "topup" | "payment">("all");
  const [limit, setLimit] = useState(20);
  const {
    transactions,
    total,
    page,
    loading: txLoading,
    load: loadTx,
    prependTransaction,
  } = useWalletTransactions(filter === "all" ? undefined : filter, limit);

  const [liveBal, setLiveBal] = useState<number | null>(null);

  // top-up sheet
  const [showSheet, setShowSheet] = useState(false);
  const [amount, setAmount] = useState("");
  const [amtInt, setAmtInt] = useState(0);
  const [method, setMethod] = useState<"mtn" | "airtel">("mtn");
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [amtErr, setAmtErr] = useState<string | null>(null);
  const [phErr, setPhErr] = useState<string | null>(null);

  // waiting screen
  const [showWait, setShowWait] = useState(false);
  const [countdown, setCountdown] = useState(150);
  const [sseEvt, setSseEvt] = useState<TopupSSEEvent | null>(null);
  const sseRef = useRef<{ close: () => void } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pageLoading = balLoading && txLoading;

  useEffect(() => {
    if (user?.phone_number) setPhone(user.phone_number);
  }, [user]);

  // cleanup on unmount
  useEffect(
    () => () => {
      sseRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }
  function startTimer() {
    setCountdown(150);
    timerRef.current = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) {
          stopTimer();
          setSseEvt({
            status: "timeout",
            message: t("wallet.paymentTimedOut"),
          });
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }

  // handle SSE events
  useEffect(() => {
    if (!sseEvt) return;
    if (sseEvt.status === "confirmed") {
      stopTimer();
      setShowWait(false);
      sseRef.current?.close();
      if (sseEvt.new_balance != null) setLiveBal(sseEvt.new_balance);
      prependTransaction({
        id: `tx-${Date.now()}`,
        type: "topup",
        amount: sseEvt.amount ?? amtInt,
        currency: sseEvt.currency ?? "RWF",
        status: "confirmed",
        description: t("wallet.topUpVia", {
          method: method === "mtn" ? "MTN MoMo" : "Airtel Money",
        }),
        created_at: new Date().toISOString(),
      });
      Alert.alert(
        t("wallet.topUpSuccessful"),
        `${sseEvt.currency} ${sseEvt.amount?.toLocaleString()} ${t("wallet.added")}.\n${t("wallet.newBalance")}: ${sseEvt.currency} ${sseEvt.new_balance?.toLocaleString()}`,
      );
    } else if (sseEvt.status === "failed") {
      stopTimer();
      setShowWait(false);
      sseRef.current?.close();
      const retry = sseEvt.retryable !== false;
      Alert.alert(
        t("wallet.paymentFailed"),
        sseEvt.message ?? t("wallet.paymentNotCompleted"),
        retry
          ? [
              { text: t("common.cancel"), style: "cancel" },
              {
                text: t("common.retry"),
                onPress: () => {
                  setAmount("");
                  setShowSheet(true);
                },
              },
            ]
          : [
              { text: t("common.ok") },
              {
                text: t("wallet.tryDifferentMethod"),
                onPress: () => {
                  setMethod(method === "mtn" ? "airtel" : "mtn");
                  setShowSheet(true);
                },
              },
            ],
      );
    } else if (sseEvt.status === "timeout") {
      stopTimer();
      setShowWait(false);
      sseRef.current?.close();
      Alert.alert(
        t("wallet.paymentTimedOut"),
        sseEvt.message ?? t("wallet.pleaseTryAgain"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("common.retry"), onPress: () => setShowSheet(true) },
        ],
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sseEvt]);

  const handleConfirm = async () => {
    if (!token) return;
    const amt = parseInt(amount, 10);
    setAmtErr(null);
    setPhErr(null);
    if (!amount || isNaN(amt) || amt < 500) {
      setAmtErr(t("wallet.minimumTopUpAmount"));
      return;
    }
    setAmtInt(amt);
    if (!phone || phone.length < 10) {
      setPhErr(t("wallet.validPhoneNumber"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await initiateTopup(token, {
        amount: amt,
        payment_method: method,
        phone,
      });
      setShowSheet(false);
      setShowWait(true);
      setSseEvt(null);
      startTimer();
      sseRef.current?.close();
      sseRef.current = createTopupSSE(
        token,
        res.topup_id,
        (e) => setSseEvt(e),
        (err) => {
          stopTimer();
          setShowWait(false);
          Alert.alert(t("wallet.connectionError"), err.message);
        },
      );
    } catch (e: any) {
      const code = e?.message ?? "";
      if (code === "INVALID_AMOUNT") setAmtErr(t("wallet.minimumTopUpAmount"));
      else if (code === "INVALID_PHONE") setPhErr(t("wallet.validPhoneNumber"));
      else Alert.alert(t("common.error"), t("wallet.failedToInitiateTopUp"));
    } finally {
      setSubmitting(false);
    }
  };

  const canConfirm =
    amount.length > 0 &&
    !isNaN(parseInt(amount, 10)) &&
    parseInt(amount, 10) >= 500 &&
    phone.length >= 10;

  const amt = parseInt(amount, 10);
  const displayBal = liveBal ?? balance?.available ?? 0;
  const currency = balance?.currency ?? "RWF";

  // Re-render when language changes
  const langKey = i18n.language;
  const _curr = current;

  if (pageLoading) return <WalletSkeleton />;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={S.root}>
        <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

        {/* ── Header ── */}
        <View
          style={[
            S.header,
            { paddingTop: Platform.OS === "android" ? 48 : 60 },
          ]}
        >
          <View style={S.hDecor1} />
          <View style={S.hDecor2} />
          <View style={S.hTop}>
            <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={S.hTitle}>{t("wallet.title")}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={S.balBlock}>
            <Text style={S.balLabel}>{t("wallet.currentBalance")}</Text>
            <Text style={S.balAmt}>{displayBal.toLocaleString()}</Text>
            <Text style={S.balCur}>{currency}</Text>
            <TouchableOpacity
              style={S.topupBtn}
              onPress={() => {
                setAmtErr(null);
                setPhErr(null);
                setAmount("");
                setShowSheet(true);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color="#0A4370" />
              <Text style={S.topupBtnTxt}>{t("wallet.topUp")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Sheet ── */}
        <View style={S.sheet}>
          {/* Filter */}
          <View style={S.filterRow}>
            {(["all", "topup", "payment"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[S.filterBtn, filter === f && S.filterBtnOn]}
                onPress={() => setFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[S.filterTxt, filter === f && S.filterTxtOn]}>
                  {f === "all"
                    ? t("wallet.all")
                    : f === "topup"
                      ? t("wallet.topUps")
                      : t("wallet.payments")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 120,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* List header */}
            <View style={S.listHdr}>
              <Text style={S.listHdrTxt}>
                {total} {t("wallet.transaction")}
                {total !== 1 ? t("wallet.transactions") : ""}
              </Text>
              <View style={S.pgSzRow}>
                {[20, 50, 100].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[S.pgSzBtn, limit === n && S.pgSzBtnOn]}
                    onPress={() => setLimit(n)}
                  >
                    <Text style={[S.pgSzTxt, limit === n && S.pgSzTxtOn]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {txLoading ? (
              <View style={{ gap: 10, marginTop: 8 }}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={S.txCard}>
                    <Bone w={48} h={48} r={14} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <Bone w="70%" h={13} r={4} />
                      <Bone w="50%" h={11} r={4} />
                    </View>
                    <Bone w={70} h={13} r={4} />
                  </View>
                ))}
              </View>
            ) : transactions.length === 0 ? (
              <View style={S.empty}>
                <View style={S.emptyIcon}>
                  <Ionicons name="wallet-outline" size={36} color="#A0A8B4" />
                </View>
                <Text style={S.emptyTitle}>
                  {t("wallet.noTransactionsYet")}
                </Text>
                <Text style={S.emptyDesc}>{t("wallet.topUpToGetStarted")}</Text>
                <TouchableOpacity
                  style={S.emptyBtn}
                  onPress={() => setShowSheet(true)}
                >
                  <Text style={S.emptyBtnTxt}>{t("wallet.topUpNow")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10, marginTop: 8 }}>
                {transactions.map((tx) => (
                  <TxCard key={tx.id} tx={tx} />
                ))}
                {total > limit && (
                  <View style={S.pgRow}>
                    <TouchableOpacity
                      style={[S.pgBtn, page <= 1 && { opacity: 0.4 }]}
                      onPress={() => page > 1 && loadTx(page - 1)}
                      disabled={page <= 1}
                    >
                      <Ionicons name="chevron-back" size={16} color="#0A4370" />
                    </TouchableOpacity>
                    <Text style={S.pgInfo}>
                      {t("wallet.page")} {page} {t("wallet.of")}{" "}
                      {Math.ceil(total / limit)}
                    </Text>
                    <TouchableOpacity
                      style={[
                        S.pgBtn,
                        page >= Math.ceil(total / limit) && { opacity: 0.4 },
                      ]}
                      onPress={() =>
                        page < Math.ceil(total / limit) && loadTx(page + 1)
                      }
                      disabled={page >= Math.ceil(total / limit)}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#0A4370"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>

        {/* ── Top-up sheet ── */}
        <Modal
          visible={showSheet}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSheet(false)}
          statusBarTranslucent
        >
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={S.backdrop}
              activeOpacity={1}
              onPress={() => setShowSheet(false)}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1, justifyContent: "flex-end" }}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  overflow: "hidden",
                }}
              >
                <View
                  style={[S.bSheet, { maxHeight: "90%", position: "relative" }]}
                >
                  <View style={S.bHandle} />
                  <View style={S.bHdr}>
                    <Text style={S.bHdrTxt}>{t("wallet.topUpWallet")}</Text>
                    <TouchableOpacity onPress={() => setShowSheet(false)}>
                      <Ionicons name="close" size={22} color="#1A202C" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    contentContainerStyle={{
                      padding: 24,
                      gap: 20,
                      paddingBottom: Platform.OS === "ios" ? 140 : 100,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                  >
                    {/* Header Description */}
                    <View style={{ marginBottom: 4 }}>
                      <Text style={S.bSubHdr}>
                        {t(
                          "wallet.topUpDescription",
                          "Add funds to your wallet for faster booking and instant ticket confirmation.",
                        )}
                      </Text>
                    </View>

                    {/* Amount */}
                    <View>
                      <Text style={S.fLabel}>{t("wallet.amount")} (RWF)</Text>
                      <View style={S.inputContainer}>
                        <Ionicons
                          name="cash-outline"
                          size={20}
                          color="#6A717D"
                          style={S.inputIcon}
                        />
                        <TextInput
                          style={[
                            S.fInput,
                            amtErr && S.fInputErr,
                            { paddingLeft: 46 },
                          ]}
                          placeholder={t("wallet.amountPlaceholder")}
                          placeholderTextColor="#A0A8B4"
                          value={amount}
                          onChangeText={(v) => {
                            setAmount(v.replace(/[^0-9]/g, ""));
                            setAmtErr(null);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      {amtErr && <Text style={S.fErr}>{amtErr}</Text>}
                      <View style={S.hintRow}>
                        <Ionicons
                          name="information-circle-outline"
                          size={14}
                          color="#A0A8B4"
                        />
                        <Text style={S.fHint}>
                          {t("wallet.minimum")}: RWF 500
                        </Text>
                      </View>
                    </View>

                    {/* Method */}
                    <View>
                      <Text style={S.fLabel}>{t("wallet.paymentMethod")}</Text>
                      <View style={S.methodRow}>
                        {(["mtn", "airtel"] as const).map((m) => (
                          <TouchableOpacity
                            key={m}
                            style={[
                              S.methodCard,
                              method === m && S.methodCardOn,
                            ]}
                            onPress={() => setMethod(m)}
                            activeOpacity={0.8}
                          >
                            <View
                              style={[
                                S.methodIconCircle,
                                {
                                  backgroundColor:
                                    m === "mtn" ? "#FFCC00" : "#E31937",
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: "900",
                                  color: "#fff",
                                }}
                              >
                                {m === "mtn" ? "M" : "A"}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  S.methodLbl,
                                  method === m && S.methodLblOn,
                                ]}
                              >
                                {m === "mtn"
                                  ? t("wallet.mtnMoMo")
                                  : t("wallet.airtelMoney")}
                              </Text>
                              <Text style={S.methodSub}>
                                {m === "mtn"
                                  ? "MTN Mobile Money"
                                  : "Airtel Money"}
                              </Text>
                            </View>
                            <View
                              style={[
                                S.radioCircle,
                                method === m && S.radioCircleOn,
                              ]}
                            >
                              {method === m && <View style={S.radioInner} />}
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Phone */}
                    <View>
                      <Text style={S.fLabel}>{t("wallet.phoneNumber")}</Text>
                      <View style={S.inputContainer}>
                        <Ionicons
                          name="call-outline"
                          size={20}
                          color="#6A717D"
                          style={S.inputIcon}
                        />
                        <TextInput
                          style={[
                            S.fInput,
                            phErr && S.fInputErr,
                            { paddingLeft: 46 },
                          ]}
                          placeholder={t("wallet.phonePlaceholder")}
                          placeholderTextColor="#A0A8B4"
                          value={phone}
                          onChangeText={(v) => {
                            setPhone(v);
                            setPhErr(null);
                          }}
                          keyboardType="phone-pad"
                        />
                      </View>
                      {phErr && <Text style={S.fErr}>{phErr}</Text>}
                      <Text style={S.fHint}>
                        {t(
                          "wallet.phoneHint",
                          "Ensure this number is registered for MoMo.",
                        )}
                      </Text>
                    </View>

                    {/* Confirm */}
                    <TouchableOpacity
                      style={[
                        S.confirmBtn,
                        (!canConfirm || submitting) && S.confirmBtnOff,
                      ]}
                      onPress={handleConfirm}
                      disabled={!canConfirm || submitting}
                      activeOpacity={0.85}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={18}
                            color="#fff"
                          />
                          <Text style={S.confirmTxt}>
                            {t("wallet.confirmTopUp")}
                            {amount && !isNaN(parseInt(amount))
                              ? ` · RWF ${parseInt(amount).toLocaleString()}`
                              : ""}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <View style={S.secureRow}>
                      <Ionicons name="lock-closed" size={12} color="#A0A8B4" />
                      <Text style={S.secureTxt}>
                        {t(
                          "wallet.securePayment",
                          "Secure & encrypted transaction",
                        )}
                      </Text>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ── MoMo waiting ── */}
        <Modal
          visible={showWait}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
          statusBarTranslucent
        >
          <View style={S.waitOverlay}>
            <View style={S.waitCard}>
              <ActivityIndicator size="large" color="#0A4370" />
              <Text style={S.waitTitle}>{t("wallet.waitingForPayment")}</Text>
              <Text style={S.waitSub}>{t("wallet.paymentRequestSentTo")}</Text>
              <Text style={S.waitPhone}>{maskPhone(phone)}</Text>
              <Text style={S.waitPin}>{t("wallet.enterPinToConfirm")}</Text>
              <View style={S.cdCard}>
                <Ionicons name="time-outline" size={18} color="#6A717D" />
                <Text style={S.cdLabel}>{t("wallet.timeRemaining")}</Text>
                <Text
                  style={[S.cdTime, countdown < 30 && { color: "#E53E3E" }]}
                >
                  {fmtCountdown(countdown)}
                </Text>
              </View>
              <TouchableOpacity
                style={S.cancelBtn}
                onPress={() => {
                  stopTimer();
                  sseRef.current?.close();
                  setShowWait(false);
                }}
              >
                <Text style={S.cancelTxt}>{t("common.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A4370" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    overflow: "hidden",
    position: "relative",
  },
  hDecor1: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -80,
    right: -60,
  },
  hDecor2: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: 20,
    left: -50,
  },
  hTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  hTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  balBlock: { alignItems: "center", gap: 4 },
  balLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balAmt: {
    fontSize: 52,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 60,
  },
  balCur: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    marginBottom: 8,
  },
  topupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  topupBtnTxt: { fontSize: 15, fontWeight: "800", color: "#0A4370" },
  sheet: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  filterBtnOn: { backgroundColor: "#0A4370", borderColor: "#0A4370" },
  filterTxt: { fontSize: 12, fontWeight: "700", color: "#6A717D" },
  filterTxtOn: { color: "#fff" },
  listHdr: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    marginTop: 4,
  },
  listHdrTxt: { fontSize: 13, fontWeight: "700", color: "#6A717D" },
  pgSzRow: { flexDirection: "row", gap: 4 },
  pgSzBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pgSzBtnOn: { backgroundColor: "#0A4370", borderColor: "#0A4370" },
  pgSzTxt: { fontSize: 11, fontWeight: "700", color: "#6A717D" },
  pgSzTxtOn: { color: "#fff" },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0A4370",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTxt: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  txDesc: { fontSize: 13, fontWeight: "700", color: "#1A202C" },
  txDate: { fontSize: 11, color: "#A0A8B4", marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: "800" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  statusTxt: { fontSize: 10, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#1A202C" },
  emptyDesc: { fontSize: 13, color: "#6A717D", textAlign: "center" },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: "#0A4370",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
  pgRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
    paddingVertical: 8,
  },
  pgBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pgInfo: { fontSize: 13, fontWeight: "600", color: "#6A717D" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
    overflow: "hidden",
  },
  bHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  bHdr: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  bHdrTxt: { fontSize: 17, fontWeight: "800", color: "#1A202C" },
  bSubHdr: {
    fontSize: 13,
    color: "#6A717D",
    lineHeight: 18,
  },
  inputContainer: {
    position: "relative",
    justifyContent: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    zIndex: 1,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  fLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 6,
  },
  fInput: {
    backgroundColor: "#F7F9FC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#1A202C",
  },
  fInputErr: { borderColor: "#E53E3E" },
  fErr: { fontSize: 12, color: "#E53E3E", marginTop: 4, fontWeight: "600" },
  fHint: { fontSize: 11, color: "#A0A8B4", marginTop: 4 },
  methodRow: {
    flexDirection: "row",
    gap: 12,
  },
  methodCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    position: "relative",
  },
  methodCardOn: {
    borderColor: "#0A4370",
    backgroundColor: "#F0F7FF",
  },
  methodIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  methodLbl: { fontSize: 14, fontWeight: "700", color: "#1A202C" },
  methodLblOn: { color: "#0A4370" },
  methodSub: { fontSize: 10, color: "#6A717D", marginTop: 1 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleOn: {
    borderColor: "#0A4370",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0A4370",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0A4370",
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
  },
  confirmBtnOff: { backgroundColor: "#CBD5E0" },
  confirmTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  secureTxt: {
    fontSize: 11,
    color: "#A0A8B4",
    fontWeight: "500",
  },
  waitOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  waitCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  waitTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A202C",
    marginTop: 8,
  },
  waitSub: { fontSize: 13, color: "#6A717D" },
  waitPhone: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A202C",
    textAlign: "center",
  },
  waitPin: {
    fontSize: 13,
    color: "#6A717D",
    fontStyle: "italic",
    textAlign: "center",
  },
  cdCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F7F9FC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  cdLabel: { fontSize: 12, color: "#6A717D", fontWeight: "600" },
  cdTime: { fontSize: 18, fontWeight: "900", color: "#0A4370" },
  cancelBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  cancelTxt: { fontSize: 14, fontWeight: "700", color: "#6A717D" },
});
