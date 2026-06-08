/**
 * Trip Detail Screen
 * Full detail view with stop selection, seat count, and booking
 */

import { PrintTicketButton } from "@/components/ticket/PrintTicketButton";
import { PaymentMethodSelector } from "@/components/trip/payment-method-selector";
import { RouteMap } from "@/components/trip/route-map";
import { SeatCounter } from "@/components/trip/seat-counter";
import { StopSelector } from "@/components/trip/stop-selector";
import { usePaymentSSE } from "@/src/hooks/use-payment-sse";
import { usePricing } from "@/src/hooks/use-pricing";
import { useTicketBooking } from "@/src/hooks/use-ticket-booking";
import { useTripDetail } from "@/src/hooks/use-trip-detail";
import { useWallet } from "@/src/hooks/use-wallet";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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

export default function TripDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId: string }>();
  const { isAuthenticated, user, token } = useAuthStore();
  const verifyPassword = useAuthStore((s) => s.verifyPassword);
  const sseRef = useRef<{ close: () => void } | null>(null);

  // Fetch trip details
  const {
    trip,
    loading: tripLoading,
    error: tripError,
  } = useTripDetail(params.tripId);

  // Translation helper for bus types
  const getBusTypeLabel = (type: string) => {
    const key = type.toLowerCase().replace(/\s+/g, "");
    // Check if key exists in home section (luxurycoach, standard, express, minibus)
    const translated = t(
      `home.${
        key === "luxurycoach"
          ? "luxuryCoach"
          : key === "minibus"
            ? "miniBus"
            : key
      }`,
      type,
    );
    return translated;
  };

  // State
  const [boardingStopId, setBoardingStopId] = useState<string | null>(null);
  const [alightingStopId, setAlightingStopId] = useState<string | null>(null);
  const [seatsCount, setSeatsCount] = useState(1);
  const [maxAvailableSeats, setMaxAvailableSeats] = useState<number | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "wallet" | "mtn" | "airtel" | "cash"
  >(isAuthenticated ? "wallet" : "mtn");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestName, setGuestName] = useState("");

  // Modal states
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMomoModal, setShowMomoModal] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);
  const [confirmedTicket, setConfirmedTicket] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(180); // Default to 3:00 for MoMo
  const countdownRef = useRef<any>(null);

  // Hooks
  const { balance, loading: walletLoading } = useWallet();

  // Helper to get stops and origin/destination from new API structure
  const stops = trip?.route?.route_stops
    ? [...trip.route.route_stops]
        .sort((a, b) => a.order - b.order)
        .map((rs) => ({ ...rs.stop, order: rs.order }))
    : [];
  const origin = stops.length > 0 ? stops[0] : null;
  const destination = stops.length > 0 ? stops[stops.length - 1] : null;
  const company = trip?.company || {
    id: "KAT",
    name: trip?.route?.name || "Katisha Transport",
    story: "",
  };

  const {
    price,
    totalPrice,
    loading: priceLoading,
    error: priceError,
  } = usePricing(boardingStopId, alightingStopId, seatsCount);

  const {
    book,
    loading: bookingLoading,
    error: bookingError,
  } = useTicketBooking();
  const { status: paymentStatus } = usePaymentSSE(pendingTicketId);

  // Initialize stops when trip loads - boarding defaults to origin, alighting to destination
  useEffect(() => {
    if (trip && stops.length > 0 && !boardingStopId && !alightingStopId) {
      setBoardingStopId(stops[0].id);
      setAlightingStopId(stops[stops.length - 1].id);
    }
  }, [trip, stops, boardingStopId, alightingStopId]);

  // Set max available seats
  useEffect(() => {
    if (trip) {
      setMaxAvailableSeats(trip.available_seats);
    }
  }, [trip]);

  // Auto-detect network from guest phone prefix
  useEffect(() => {
    if (!guestPhone || guestPhone.length < 3 || isAuthenticated) return;

    // Normalize phone number (remove +, spaces, etc)
    const normalized = guestPhone.replace(/\D/g, "");

    // Check for MTN: 078, 079, 070 (or 25078, etc)
    const isMTN =
      /^(078|079|070|25078|25079|25070)/.test(normalized) ||
      (normalized.length >= 3 &&
        ["078", "079", "070"].includes(normalized.substring(0, 3)));

    // Check for Airtel: 072, 073, 074
    const isAirtel =
      /^(072|073|074|25072|25073|25074)/.test(normalized) ||
      (normalized.length >= 3 &&
        ["072", "073", "074"].includes(normalized.substring(0, 3)));

    if (isMTN && paymentMethod !== "mtn") {
      setPaymentMethod("mtn");
    } else if (isAirtel && paymentMethod !== "airtel") {
      setPaymentMethod("airtel");
    }
  }, [guestPhone, isAuthenticated, paymentMethod]);

  // Countdown timer for MoMo
  useEffect(() => {
    if (showMomoModal && pendingTicketId) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            handleMomoTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [showMomoModal, pendingTicketId]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, []);

  // Handle payment status updates
  useEffect(() => {
    if (!paymentStatus || !trip) return;

    if (paymentStatus.status === "confirmed" && paymentStatus.ticket) {
      setPendingTicketId(null);
      if (countdownRef.current) clearInterval(countdownRef.current);

      // For cash payments (staff flow), we show the print button in the modal
      // rather than navigating away immediately
      if (paymentMethod === "cash") {
        setConfirmedTicket(paymentStatus.ticket);
        return;
      }

      setShowMomoModal(false);
      // Navigate to success page with full ticket data from SSE
      router.push({
        pathname: "/booking-success" as never,
        params: {
          booking: JSON.stringify({
            id: paymentStatus.ticket.id,
            trip: {
              id: trip.id,
              from: origin,
              to: destination,
              departureTime: trip.departure_at,
              arrivalTime: trip.departure_at,
              duration: "2h 30m",
              operator: company.name,
              operatorId: company.id || "KAT",
              price: paymentStatus.ticket.amount || totalPrice,
              currency: trip.currency,
              seatsAvailable: trip.available_seats,
              busType: getBusTypeLabel(trip.bus.type),
            },
            passenger: {
              fullName:
                paymentStatus.ticket.passenger_name ||
                (user?.first_name
                  ? `${user.first_name} ${user.last_name}`
                  : "Passenger"),
              phone:
                paymentStatus.ticket.passenger_phone ||
                guestPhone ||
                user?.phone_number ||
                "",
              email: user?.email || "",
            },
            seatNumber: "12A",
            bookingRef: `KAT-${paymentStatus.ticket.id.slice(-4).toUpperCase()}`,
            status: "confirmed",
            bookedAt: new Date().toISOString(),
            totalPaid: paymentStatus.ticket.amount || totalPrice,
            currency: trip.currency,
            issuedBy: user?.first_name ? `${user.first_name} ${user.last_name}` : undefined,
          }),
        },
      });
    } else if (paymentStatus.status === "failed") {
      if (countdownRef.current) clearInterval(countdownRef.current);

      const isRetryable = paymentStatus.retryable !== false;
      Alert.alert(
        t("payment.failed", "Payment Failed"),
        paymentStatus.message || t("payment.tryAgain", "Please try again"),
        isRetryable
          ? [
              {
                text: t("common.cancel", "Cancel"),
                style: "cancel",
                onPress: () => setShowMomoModal(false),
              },
              {
                text: t("payment.retryPayment", "Retry Payment"),
                onPress: handleRetryMomo,
              },
            ]
          : [
              {
                text: t("common.ok", "OK"),
                onPress: () => setShowMomoModal(false),
              },
              {
                text: t("payment.differentMethod", "Try different method"),
                onPress: () => {
                  setShowMomoModal(false);
                  setPendingTicketId(null);
                },
              },
            ],
      );
    } else if (
      paymentStatus.status === "timeout" ||
      paymentStatus.status === "expired"
    ) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      handleMomoTimeout(
        paymentStatus.status === "expired" ? "expired" : "timeout",
      );
    } else if (paymentStatus.status === "cancelled") {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setShowMomoModal(false);
      Alert.alert(t("payment.cancelled", "Payment Cancelled"));
    }
  }, [paymentStatus, router, t, trip]);

  const handleMomoTimeout = (type: "timeout" | "expired" = "timeout") => {
    Alert.alert(
      type === "expired"
        ? t("payment.expired", "Ticket Expired")
        : t("payment.timeout", "Payment Timeout"),
      type === "expired"
        ? t(
            "payment.expiredMessage",
            "The seat hold has expired. Please try again.",
          )
        : t("payment.timeoutMessage", "Payment timed out"),
      [
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel",
          onPress: () => setShowMomoModal(false),
        },
        {
          text: t("payment.retryPayment", "Retry Payment"),
          onPress: handleRetryMomo,
        },
      ],
    );
  };

  const handleRetryMomo = () => {
    // Reset countdown based on payment method
    const ttl =
      paymentMethod === "wallet" || paymentMethod === "cash" ? 30 : 180;
    setCountdown(ttl);
    setPendingTicketId(null);
    handleMomoConfirm();
  };

  const handleProceedToPay = () => {
    if (!trip || !boardingStopId || !alightingStopId || !totalPrice) return;

    // Validate guest info for non-authenticated users
    if (!isAuthenticated) {
      if (!guestPhone || !guestName) {
        Alert.alert(
          t("validation.required", "Required"),
          t("validation.guestInfo", "Please enter your name and phone number"),
        );
        return;
      }
    }

    // Set countdown based on payment method: 30s for wallet/cash, 180s for MoMo/Airtel
    const ttl =
      paymentMethod === "wallet" || paymentMethod === "cash" ? 30 : 180;
    setCountdown(ttl);

    // Show appropriate modal
    if (isAuthenticated && paymentMethod === "wallet") {
      setShowWalletModal(true);
    } else if (paymentMethod === "cash") {
      // Cash payment doesn't need password, goes straight to MoMo-style waiting modal
      handleMomoConfirm();
      setShowMomoModal(true);
    } else {
      setShowMomoModal(true);
    }
  };

  const handleWalletConfirm = async () => {
    if (!trip || !boardingStopId || !alightingStopId || !totalPrice || !token)
      return;

    // Verify password against auth store before proceeding
    const passwordOk = await verifyPassword(walletPassword);
    if (!passwordOk) {
      Alert.alert(
        t("payment.wrongPassword", "Wrong Password"),
        t(
          "payment.wrongPasswordMsg",
          "The password you entered is incorrect. Please try again.",
        ),
      );
      return;
    }

    setShowWalletModal(false);
    setWalletPassword("");

    const response = await book({
      trip_id: trip.id,
      boarding_stop_id: boardingStopId,
      alighting_stop_id: alightingStopId,
      seats_count: seatsCount,
      payment_method: "wallet",
    });

    if (response) {
      if (response.status === "confirmed") {
        // Immediate confirmation
        router.push({
          pathname: "/booking-success" as never,
          params: {
            booking: JSON.stringify({
              id: response.id,
              trip: {
                id: trip.id,
                from: origin,
                to: destination,
                departureTime: trip.departure_at,
                arrivalTime: trip.departure_at, // Mocking arrival as departure for success page
                duration: t("trip.duration", "2h 30m"),
                operator: company.name,
                operatorId: company.id || "KAT",
                price: response.amount || totalPrice,
                currency: trip.currency,
                seatsAvailable: trip.available_seats,
                busType: getBusTypeLabel(trip.bus.type),
              },
              passenger: {
                fullName: user?.first_name
                  ? `${user.first_name} ${user.last_name}`
                  : t("trip.passenger", "Passenger"),
                phone: user?.phone_number || "",
                email: user?.email || "",
              },
              seatNumber: "12A",
              bookingRef: `KAT-${response.id.slice(-4).toUpperCase()}`,
              status: "confirmed",
              bookedAt: new Date().toISOString(),
              totalPaid: response.amount || totalPrice,
            currency: trip.currency,
            issuedBy: user?.first_name ? `${user.first_name} ${user.last_name}` : undefined,
          }),
          },
        });
      } else if (response.status === "payment_pending" || response.ticket_id) {
        // Requirement says wallet also creates ticket at payment_pending
        setPendingTicketId(response.ticket_id || response.id);
        setShowMomoModal(true); // Reuse MoMo modal for waiting state
      }
    } else if (bookingError) {
      // Handle specific errors
      if (
        bookingError.includes("INSUFFICIENT_WALLET_BALANCE") ||
        bookingError.includes("INSUFFICIENT_FUNDS")
      ) {
        Alert.alert(
          t("payment.insufficientBalance", "Insufficient Balance"),
          t(
            "payment.topUpPrompt",
            "Not enough balance to complete this purchase",
          ),
          [
            { text: t("common.cancel", "Cancel"), style: "cancel" },
            {
              text: t("payment.topUp", "Top Up"),
              onPress: () => router.push("/wallet" as never),
            },
          ],
        );
      } else {
        Alert.alert(t("booking.failed", "Booking Failed"), bookingError, [
          { text: t("common.ok", "OK") },
        ]);
      }
    }
  };

  const handleMomoConfirm = async () => {
    if (!trip || !boardingStopId || !alightingStopId || !totalPrice) return;

    const response = await book({
      trip_id: trip.id,
      boarding_stop_id: boardingStopId,
      alighting_stop_id: alightingStopId,
      seats_count: seatsCount,
      payment_method: paymentMethod,
      phone: guestPhone,
      passenger_name: guestName,
    });

    if (response) {
      if (response.status === "confirmed") {
        if (paymentMethod === "cash") {
          setConfirmedTicket(response);
          return;
        }
        // Navigate to success for other methods if immediate
        router.push({
          pathname: "/booking-success" as never,
          params: {
            booking: JSON.stringify({
              id: response.id,
              trip: {
                id: trip.id,
                from: origin,
                to: destination,
                departureTime: trip.departure_at,
                arrivalTime: trip.departure_at,
                duration: t("trip.duration", "2h 30m"),
                operator: company.name,
                operatorId: company.id || "KAT",
                price: response.amount || totalPrice,
                currency: trip.currency,
                seatsAvailable: trip.available_seats,
                busType: getBusTypeLabel(trip.bus.type),
              },
              passenger: {
                fullName: guestName || (user?.first_name ? `${user.first_name} ${user.last_name}` : t("trip.passenger", "Passenger")),
                phone: guestPhone || user?.phone_number || "",
                email: user?.email || "",
              },
              seatNumber: "12A",
              bookingRef: `KAT-${response.id.slice(-4).toUpperCase()}`,
              status: "confirmed",
              bookedAt: new Date().toISOString(),
              totalPaid: response.amount || totalPrice,
              currency: trip.currency,
              issuedBy: user?.first_name ? `${user.first_name} ${user.last_name}` : undefined,
            }),
          },
        });
      } else if (response.ticket_id || response.status === "payment_pending") {
        // MoMo/Airtel/Cash payment - SSE flow initiated (202)
        setPendingTicketId(response.ticket_id || response.id);
        const ttl =
          paymentMethod === "wallet" || paymentMethod === "cash" ? 30 : 180;
        setCountdown(ttl); // Reset countdown
      }
    } else if (bookingError) {
      // Handle NO_SEATS_AVAILABLE error
      if (bookingError.includes("NO_SEATS_AVAILABLE")) {
        const match = bookingError.match(/available:\s*(\d+)/);
        const availableCount = match ? parseInt(match[1], 10) : 0;

        setMaxAvailableSeats(availableCount);
        setSeatsCount(Math.min(seatsCount, availableCount));
        setShowMomoModal(false);

        Alert.alert(
          t("trip.noSeatsAvailable", "No seats available"),
          t("trip.onlySeatsLeft", "Only {{count}} seats remaining", {
            count: availableCount,
          }),
          [{ text: t("common.ok", "OK") }],
        );
      } else {
        setShowMomoModal(false);
        Alert.alert(t("booking.failed", "Booking Failed"), bookingError, [
          { text: t("common.ok", "OK") },
        ]);
      }
    }
  };

  // Get disabled stops for alighting (must be after boarding)
  const disabledAlightingStops =
    stops.length > 0 && boardingStopId
      ? stops
          .filter(
            (s) =>
              s.order <=
              (stops.find((st) => st.id === boardingStopId)?.order || 0),
          )
          .map((s) => s.id)
      : [];

  // Get disabled stops for boarding (must be before alighting)
  const disabledBoardingStops =
    stops.length > 0 && alightingStopId
      ? stops
          .filter(
            (s) =>
              s.order >=
              (stops.find((st) => st.id === alightingStopId)?.order || 999),
          )
          .map((s) => s.id)
      : [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale =
      i18n.language === "rw"
        ? "rw-RW"
        : i18n.language === "fr"
          ? "fr-FR"
          : "en-US";
    return date.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const maskPhone = (phone: string) => {
    if (phone.length < 10) return phone;
    const start = phone.slice(0, -6);
    const end = phone.slice(-3);
    return `${start}***${end}`;
  };

  // Check if proceed button should be disabled
  const isProceedDisabled =
    bookingLoading ||
    !totalPrice ||
    priceError !== null ||
    (maxAvailableSeats !== null && maxAvailableSeats === 0);

  // Loading skeleton
  if (tripLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0A4370" />
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonHeaderTop} />
          <View style={styles.skeletonCompanyCard} />
          <View style={styles.skeletonRouteCard} />
        </View>
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCard} />
        </View>
      </View>
    );
  }

  if (tripError || !trip) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#F7F9FC" />
          <Ionicons name="alert-circle" size={64} color="#E53E3E" />
          <Text style={styles.errorTitle}>
            {t("trip.error", "Failed to load trip")}
          </Text>
          <Text style={styles.errorMessage}>
            {tripError ||
              t("trip.notFound", "Trip not found or no longer available")}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>
              {t("common.back", "Go Back")}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const effectiveAvailableSeats =
    maxAvailableSeats !== null ? maxAvailableSeats : trip.available_seats;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.root}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />

          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {t("trip.details", "Trip Details")}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Company Info */}
          <View style={styles.companyCard}>
            <View style={styles.companyLogo}>
              <Text style={{ fontSize: 32 }}>🚌</Text>
            </View>
            <View style={styles.companyInfo}>
              <View style={styles.companyHeaderRow}>
                <Text style={styles.companyLabel}>
                  {t("booking.operator", "Operator")}
                </Text>
              </View>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.companyStory}>{company.story}</Text>
            </View>
          </View>

          {/* Route Info */}
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.routePoint}>
                <Text style={styles.routeCity}>{origin?.name}</Text>
                <Text style={styles.routeTime}>
                  {formatDate(trip.departure_at)}
                </Text>
              </View>
              <View style={styles.routeMiddle}>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
                {trip.is_express && (
                  <View style={styles.expressBadge}>
                    <Ionicons name="flash" size={10} color="#F6AD55" />
                    <Text style={styles.expressBadgeText}>
                      {t("trip.express", "EXPRESS")}
                    </Text>
                  </View>
                )}
              </View>
              <View style={[styles.routePoint, { alignItems: "flex-end" }]}>
                <Text style={styles.routeCity}>{destination?.name}</Text>
              </View>
            </View>

            {/* Series / Schedule Info */}
            {trip.series && (
              <View style={styles.seriesInfo}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.seriesText}>
                  {trip.series.repeat_daily
                    ? t("trip.daily", "Daily")
                    : t("trip.oneTime", "One-off")}
                  {trip.series.frequency_minutes &&
                    ` • ${t("trip.every", "Every")} ${trip.series.frequency_minutes} ${t("trip.mins", "mins")}`}
                </Text>
              </View>
            )}

            <View style={styles.routeFooter}>
              <View style={styles.routeInfo}>
                <Ionicons
                  name="people"
                  size={14}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.routeInfoText}>
                  {trip.available_seats}/{trip.total_seats}{" "}
                  {t("trip.available", "available")}
                </Text>
              </View>
              <View style={styles.routeInfo}>
                <Ionicons name="bus" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.routeInfoText}>
                  {getBusTypeLabel(trip.bus.type)} • {trip.bus.plate}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stops Section - Only show if not express */}
          {!trip.is_express && stops.length > 0 && (
            <>
              <StopSelector
                stops={stops}
                selectedStopId={boardingStopId}
                onSelect={setBoardingStopId}
                label={t("trip.boardingStop", "Boarding Stop")}
                type="boarding"
                disabledStopIds={disabledBoardingStops}
              />

              <StopSelector
                stops={stops}
                selectedStopId={alightingStopId}
                onSelect={setAlightingStopId}
                label={t("trip.alightingStop", "Where you get out")}
                type="alighting"
                disabledStopIds={disabledAlightingStops}
              />
            </>
          )}

          {/* Route Map — OpenStreetMap showing bus route and stops */}
          <View style={styles.mapSection}>
            <View style={styles.mapHeader}>
              <Ionicons name="map-outline" size={16} color="#0A4370" />
              <Text style={styles.mapTitle}>
                {t("trip.routeMap", "Route Map")}
              </Text>
              <View style={styles.mapLegend}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#0A4370" }]}
                />
                <Text style={styles.legendText}>
                  {t("trip.boarding", "Boarding")}
                </Text>
                <View
                  style={[styles.legendDot, { backgroundColor: "#38A169" }]}
                />
                <Text style={styles.legendText}>
                  {t("trip.alighting", "Alighting")}
                </Text>
              </View>
            </View>
            <RouteMap
              origin={{
                id: origin?.id || "",
                name: origin?.name || "",
                lat: origin?.lat || 0,
                lng: origin?.lng || 0,
              }}
              destination={{
                id: destination?.id || "",
                name: destination?.name || "",
                lat: destination?.lat || 0,
                lng: destination?.lng || 0,
              }}
              stops={stops.map((s) => ({
                id: s.id,
                name: s.name,
                lat: s.lat,
                lng: s.lng,
                order: s.order,
              }))}
              boardingStopId={boardingStopId}
              alightingStopId={alightingStopId}
              height={240}
            />
          </View>

          {/* Bus & Service Info */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>
              {t("trip.busServiceInfo", "Bus & Service Information")}
            </Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailsItem}>
                <Ionicons name="bus-outline" size={18} color="#0A4370" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailsItemLabel} numberOfLines={1}>
                    {t("trip.busPlate", "Plate Number")}
                  </Text>
                  <Text style={styles.detailsItemValue}>{trip.bus.plate}</Text>
                </View>
              </View>
              <View style={styles.detailsItem}>
                <Ionicons name="construct-outline" size={18} color="#0A4370" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailsItemLabel} numberOfLines={1}>
                    {t("trip.busType", "Bus Type")}
                  </Text>
                  <Text style={styles.detailsItemValue}>
                    {getBusTypeLabel(trip.bus.type)}
                  </Text>
                </View>
              </View>
              <View style={styles.detailsItem}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="#0A4370"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailsItemLabel} numberOfLines={1}>
                    {t("trip.amenities", "Amenities")}
                  </Text>
                  <Text style={styles.detailsItemValue}>
                    {t("trip.amenitiesList", "Wi-Fi, AC, USB")}
                  </Text>
                </View>
              </View>
              <View style={styles.detailsItem}>
                <Ionicons name="time-outline" size={18} color="#0A4370" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailsItemLabel} numberOfLines={1}>
                    {t("trip.departure", "Departure")}
                  </Text>
                  <Text style={styles.detailsItemValue}>
                    {formatDate(trip.departure_at)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Seat Counter */}
          <SeatCounter
            count={seatsCount}
            onChange={setSeatsCount}
            availableSeats={effectiveAvailableSeats}
          />

          {/* Guest Info - Only for non-authenticated users */}
          {!isAuthenticated && (
            <View style={styles.guestForm}>
              <Text style={styles.guestFormTitle}>
                {t("trip.passengerInfo", "Passenger Information")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("trip.fullName", "Full Name")}
                placeholderTextColor="#A0A8B4"
                value={guestName}
                onChangeText={setGuestName}
              />
              <TextInput
                style={styles.input}
                placeholder={t("trip.phoneNumber", "Phone Number")}
                placeholderTextColor="#A0A8B4"
                value={guestPhone}
                onChangeText={setGuestPhone}
                keyboardType="phone-pad"
              />
            </View>
          )}

          {/* Payment Method */}
          <PaymentMethodSelector
            selected={paymentMethod}
            onSelect={setPaymentMethod}
            isAuthenticated={isAuthenticated}
            walletBalance={balance?.available}
            currency={trip.currency}
          />

          {/* Price Summary */}
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {t("trip.pricePerSeat", "Price per seat")}
              </Text>
              {priceLoading ? (
                <ActivityIndicator size="small" color="#0A4370" />
              ) : priceError ? (
                <Text style={styles.priceError}>
                  {t("trip.priceUnavailable", "Price unavailable")}
                </Text>
              ) : price ? (
                <Text style={styles.priceValue}>
                  {price.currency} {price.amount.toLocaleString()}
                </Text>
              ) : (
                <Text style={styles.priceValue}>-</Text>
              )}
            </View>

            {priceError && (
              <View style={styles.priceErrorBanner}>
                <Ionicons name="alert-circle" size={16} color="#E53E3E" />
                <Text style={styles.priceErrorText}>
                  {t(
                    "trip.priceUnavailable",
                    "Price unavailable for this combination",
                  )}
                </Text>
              </View>
            )}

            {!priceError && (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    {t("trip.seats", "Seats")} × {seatsCount}
                  </Text>
                  <Text style={styles.priceValue}>
                    {totalPrice
                      ? `${trip.currency} ${totalPrice.toLocaleString()}`
                      : "-"}
                  </Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceTotalLabel}>
                    {t("trip.total", "Total")}
                  </Text>
                  <Text style={styles.priceTotalValue}>
                    {totalPrice
                      ? `${trip.currency} ${totalPrice.toLocaleString()}`
                      : "-"}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Book Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.bookButton,
              isProceedDisabled && styles.bookButtonDisabled,
            ]}
            onPress={handleProceedToPay}
            disabled={isProceedDisabled}
            activeOpacity={0.8}
          >
            {bookingLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.bookButtonText}>
                  {t("trip.proceedToPay", "Proceed to Pay")}
                </Text>
                {totalPrice && !priceError && (
                  <Text style={styles.bookButtonPrice}>
                    {trip.currency} {totalPrice.toLocaleString()}
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Wallet Confirmation Modal */}
        <Modal visible={showWalletModal} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {t("payment.confirmPayment", "Confirm Payment")}
                  </Text>
                  <TouchableOpacity onPress={() => setShowWalletModal(false)}>
                    <Ionicons name="close" size={24} color="#1A202C" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {/* Trip Summary */}
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>{company.name}</Text>
                    <Text style={styles.summaryRoute}>
                      {origin?.name} → {destination?.name}
                    </Text>
                    <Text style={styles.summaryDetail}>
                      {formatDate(trip.departure_at)}
                    </Text>
                    <Text style={styles.summaryDetail}>
                      {seatsCount}{" "}
                      {seatsCount === 1
                        ? t("trip.seat", "seat")
                        : t("trip.seats", "seats")}
                    </Text>
                  </View>

                  {/* Wallet Balance */}
                  {balance && (
                    <View style={styles.balanceDisplay}>
                      <Text style={styles.balanceDisplayLabel}>
                        {t("payment.walletBalance", "Wallet Balance")}
                      </Text>
                      <Text style={styles.balanceDisplayAmount}>
                        {trip.currency} {balance.available.toLocaleString()}
                      </Text>
                    </View>
                  )}

                  {/* Total */}
                  <View style={styles.totalDisplay}>
                    <Text style={styles.totalLabel}>
                      {t("trip.total", "Total")}
                    </Text>
                    <Text style={styles.totalAmount}>
                      {trip.currency} {totalPrice?.toLocaleString()}
                    </Text>
                  </View>

                  {/* Check if balance is sufficient */}
                  {balance && totalPrice && balance.available < totalPrice ? (
                    <View style={styles.insufficientBalance}>
                      <Ionicons name="alert-circle" size={20} color="#E53E3E" />
                      <Text style={styles.insufficientText}>
                        {t(
                          "payment.insufficientBalance",
                          "Insufficient Balance",
                        )}
                      </Text>
                      <TouchableOpacity
                        style={styles.topUpButton}
                        onPress={() => {
                          setShowWalletModal(false);
                          router.push("/wallet" as never);
                        }}
                      >
                        <Text style={styles.topUpButtonText}>
                          {t("payment.topUp", "Top Up")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      {/* Password Input */}
                      <View style={styles.passwordSection}>
                        <Text style={styles.passwordLabel}>
                          {t(
                            "payment.enterPassword",
                            "Enter your password to confirm",
                          )}
                        </Text>
                        <TextInput
                          style={styles.passwordInput}
                          placeholder={t("payment.password", "Password")}
                          placeholderTextColor="#A0A8B4"
                          value={walletPassword}
                          onChangeText={setWalletPassword}
                          secureTextEntry
                          autoFocus
                        />
                      </View>

                      {/* Confirm Button */}
                      <TouchableOpacity
                        style={[
                          styles.confirmButton,
                          !walletPassword && styles.confirmButtonDisabled,
                        ]}
                        onPress={handleWalletConfirm}
                        disabled={!walletPassword || bookingLoading}
                      >
                        {bookingLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.confirmButtonText}>
                            {t("payment.confirm", "Confirm Payment")}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* MoMo Confirmation Modal */}
        <Modal
          visible={showMomoModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            if (!pendingTicketId && !confirmedTicket) setShowMomoModal(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {confirmedTicket
                    ? t("bookingSuccess.confirmed", "Booking Confirmed")
                    : pendingTicketId
                      ? t(
                          "payment.waitingConfirmation",
                          "Waiting for confirmation",
                        )
                      : t("payment.confirmPayment", "Confirm Payment")}
                </Text>
                {(!pendingTicketId || confirmedTicket) && (
                  <TouchableOpacity
                    onPress={() => {
                      setShowMomoModal(false);
                      setConfirmedTicket(null);
                      if (confirmedTicket) router.replace("/" as never);
                    }}
                  >
                    <Ionicons name="close" size={24} color="#1A202C" />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView style={styles.modalScroll}>
                {confirmedTicket ? (
                  <View style={styles.successContainer}>
                    <View style={styles.successIconWrapper}>
                      <Ionicons
                        name="checkmark-circle"
                        size={64}
                        color="#38A169"
                      />
                    </View>
                    <Text style={styles.successTitle}>
                      {t("bookingSuccess.bookingSuccessful")}
                    </Text>
                    <Text style={styles.successSubtitle}>
                      {t("booking.statusConfirmed")}
                    </Text>

                    <View style={styles.successDetails}>
                      <View style={styles.successRow}>
                        <Text style={styles.successLabel}>
                          {t("bookingSuccess.bookingRef")}
                        </Text>
                        <Text style={styles.successValue}>
                          KAT-
                          {confirmedTicket.id.slice(-4).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.successRow}>
                        <Text style={styles.successLabel}>
                          {t("booking.passenger")}
                        </Text>
                        <Text style={styles.successValue}>
                          {confirmedTicket.passenger_name || guestName}
                        </Text>
                      </View>
                      <View style={styles.successRow}>
                        <Text style={styles.successLabel}>
                          {t("trip.total")}
                        </Text>
                        <Text style={styles.successValue}>
                          {trip.currency}{" "}
                          {(
                            confirmedTicket.amount || totalPrice
                          ).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <PrintTicketButton
                      ticketId={confirmedTicket.id}
                      ticketData={{
                        ticketId: confirmedTicket.id,
                        companyName: company.name,
                        passengerName:
                          confirmedTicket.passenger_name || guestName,
                        passengerPhone:
                          confirmedTicket.passenger_phone || guestPhone,
                        boardingStop: stops.find((s) => s.id === boardingStopId)
                          ?.name,
                        alightingStop: stops.find(
                          (s) => s.id === alightingStopId,
                        )?.name,
                        departureDate: new Date(
                          trip.departure_at,
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }),
                        departureTime: new Date(
                          trip.departure_at,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                        seatsCount: seatsCount,
                        totalAmount: `${trip.currency} ${(confirmedTicket.amount || totalPrice).toLocaleString()}`,
                        paymentMethod: "Cash",
                        busPlate: trip.bus.plate,
                        issuedBy: user?.first_name
                          ? `${user.first_name} ${user.last_name}`
                          : "Staff",
                      }}
                      style={{ marginTop: 20 }}
                    />

                    <TouchableOpacity
                      style={styles.doneButton}
                      onPress={() => {
                        setShowMomoModal(false);
                        setConfirmedTicket(null);
                        router.replace("/" as never);
                      }}
                    >
                      <Text style={styles.doneButtonText}>
                        {t("common.done", "Done")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : !pendingTicketId ? (
                  <>
                    {/* Trip Summary */}
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryLabel}>{company.name}</Text>
                      <Text style={styles.summaryRoute}>
                        {origin?.name} → {destination?.name}
                      </Text>
                      <Text style={styles.summaryDetail}>
                        {formatDate(trip.departure_at)}
                      </Text>
                      <Text style={styles.summaryDetail}>
                        {seatsCount}{" "}
                        {seatsCount === 1
                          ? t("trip.seat", "seat")
                          : t("trip.seats", "seats")}
                      </Text>
                    </View>

                    {/* Total */}
                    <View style={styles.totalDisplay}>
                      <Text style={styles.totalLabel}>
                        {t("trip.total", "Total")}
                      </Text>
                      <Text style={styles.totalAmount}>
                        {trip.currency} {totalPrice?.toLocaleString()}
                      </Text>
                    </View>

                    {/* Confirm Button */}
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleMomoConfirm}
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.confirmButtonText}>
                          {t("payment.confirm", "Confirm Payment")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Waiting for Payment */}
                    <View style={styles.waitingCard}>
                      <ActivityIndicator size="large" color="#0A4370" />
                      <Text style={styles.waitingTitle}>
                        {t("payment.enterPin", "Enter your PIN to confirm")}
                      </Text>
                      <Text style={styles.waitingPhone}>
                        {t("payment.maskedPhone", "Payment request sent to")}
                      </Text>
                      <Text style={styles.waitingPhoneNumber}>
                        {maskPhone(guestPhone || user?.phone_number || "")}
                      </Text>

                      {/* Countdown */}
                      <View style={styles.countdownCard}>
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#6A717D"
                        />
                        <Text style={styles.countdownLabel}>
                          {t("payment.countdown", "Time remaining")}
                        </Text>
                        <Text style={styles.countdownTime}>
                          {formatCountdown(countdown)}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F9FC" },

  // Loading Skeleton
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  skeletonHeader: {
    backgroundColor: "#0A4370",
    paddingTop: Platform.OS === "android" ? 12 : 50,
    paddingBottom: 20,
    paddingHorizontal: 18,
  },
  skeletonHeaderTop: {
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    marginBottom: 20,
  },
  skeletonCompanyCard: {
    height: 88,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    marginBottom: 16,
  },
  skeletonRouteCard: {
    height: 120,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
  },
  skeletonContent: {
    padding: 18,
    gap: 20,
  },
  skeletonCard: {
    height: 100,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },

  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#6A717D",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#F7F9FC",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A202C",
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: "#6A717D",
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: "#0A4370",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Header
  header: {
    backgroundColor: "#0A4370",
    paddingTop: Platform.OS === "android" ? 12 : 50,
    paddingBottom: 20,
    paddingHorizontal: 18,
    overflow: "hidden",
  },
  headerDecor1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -100,
    right: -80,
  },
  headerDecor2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: 20,
    left: -60,
  },
  headerTop: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
  },

  // Company Card
  companyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  companyInfo: {
    flex: 1,
  },
  companyHeaderRow: {
    marginBottom: 2,
  },
  companyLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
  },
  companyStory: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 16,
  },

  // Route Card
  routeCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  routePoint: {
    flex: 1,
  },
  routeCity: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
  },
  routeTime: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  routeMiddle: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  expressBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(246,173,85,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  expressBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#F6AD55",
  },
  seriesInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  seriesText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "700",
  },
  routeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  routeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routeInfoText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },

  // Content
  content: {
    flex: 1,
  },

  // Guest Form
  guestForm: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  guestFormTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
    marginBottom: 14,
  },

  // Route map section
  mapSection: {
    marginHorizontal: 18,
    marginBottom: 20,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A202C",
    flex: 1,
  },
  mapLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A202C",
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  detailsItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "47%",
  },
  detailsItemLabel: {
    fontSize: 10,
    color: "#6A717D",
    fontWeight: "600",
  },
  detailsItemValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A202C",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: "#6A717D",
    fontWeight: "600",
    marginRight: 6,
  },
  input: {
    backgroundColor: "#F7F9FC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A202C",
    borderWidth: 1,
    borderColor: "#E8EDF5",
    marginBottom: 10,
  },

  // Price Card
  priceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: "#6A717D",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
  },
  priceError: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E53E3E",
  },
  priceErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF5F5",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  priceErrorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#E53E3E",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#E8EDF5",
    marginVertical: 8,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0A4370",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "#E8EDF5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  bookButton: {
    backgroundColor: "#0A4370",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
  bookButtonPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A202C",
  },
  modalScroll: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#F7F9FC",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6A717D",
    marginBottom: 4,
  },
  summaryRoute: {
    fontSize: 16,
    fontWeight: "900",
    color: "#1A202C",
    marginBottom: 8,
  },
  summaryDetail: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6A717D",
    marginBottom: 2,
  },
  balanceDisplay: {
    backgroundColor: "#F0FFF4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C6F6D5",
  },
  balanceDisplayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#22543D",
    marginBottom: 4,
  },
  balanceDisplayAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#22543D",
  },
  totalDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E8EDF5",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0A4370",
  },
  insufficientBalance: {
    alignItems: "center",
    padding: 20,
  },
  insufficientText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E53E3E",
    marginTop: 8,
    marginBottom: 16,
  },
  topUpButton: {
    backgroundColor: "#0A4370",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  topUpButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  passwordSection: {
    marginBottom: 20,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6A717D",
    marginBottom: 10,
  },
  passwordInput: {
    backgroundColor: "#F7F9FC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1A202C",
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  confirmButton: {
    backgroundColor: "#0A4370",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
  },
  waitingCard: {
    alignItems: "center",
    paddingVertical: 30,
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A202C",
    marginTop: 20,
    textAlign: "center",
  },
  waitingPhone: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6A717D",
    marginTop: 12,
  },
  waitingPhoneNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0A4370",
    marginTop: 4,
  },
  countdownCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6A717D",
  },
  countdownTime: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0A4370",
    marginLeft: "auto",
  },
  // Success state in modal
  successContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0FFF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A202C",
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#38A169",
    marginBottom: 24,
  },
  successDetails: {
    width: "100%",
    backgroundColor: "#F7F9FC",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successLabel: {
    fontSize: 13,
    color: "#6A717D",
    fontWeight: "500",
  },
  successValue: {
    fontSize: 14,
    color: "#1A202C",
    fontWeight: "700",
  },
  doneButton: {
    width: "100%",
    backgroundColor: "#F7F9FC",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6A717D",
  },
});
