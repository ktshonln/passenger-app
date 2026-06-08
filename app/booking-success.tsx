import { PrintTicketButton } from "@/components/ticket/PrintTicketButton";
import { AppBar } from "@/components/ui/app-bar";
import { useBookings } from "@/hooks/use-bookings";
import { Booking } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-2.5 border-b border-border">
      <Text className="text-[13px] text-secondary-text">{label}</Text>
      <Text className="text-[13px] font-semibold text-dark-text">{value}</Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className="bg-white rounded-2xl mb-3 overflow-hidden"
      style={{
        shadowColor: "#0A4370",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      <View className="px-4 py-3 border-b border-border">
        <Text className="text-[11px] font-black text-secondary-text tracking-widest uppercase">
          {title}
        </Text>
      </View>
      <View className="px-4 pb-1">{children}</View>
    </View>
  );
}

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ booking: string }>();
  const booking: Booking = JSON.parse(params.booking ?? "{}");
  const { addBooking } = useBookings();

  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (booking?.id) addBooking(booking);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 12,
        bounciness: 10,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 4,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatDate(iso: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />
      <AppBar
        title={t("bookingSuccess.confirmed")}
        subtitle={t("bookingSuccess.seatSecured")}
        showBack={true}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          className="items-center py-5"
          style={{ transform: [{ scale: scaleAnim }] }}
        >
          <View className="w-[72px] h-[72px] rounded-full bg-green-100 items-center justify-center mb-3">
            <Ionicons name="checkmark-circle" size={48} color="#38A169" />
          </View>
          <Text className="text-[19px] font-black text-dark-text">
            {t("bookingSuccess.bookingSuccessful")}
          </Text>
          <Text className="text-[13px] text-secondary-text mt-1">
            {t("bookingSuccess.checkEmail")}
          </Text>
        </Animated.View>

        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <View
            className="bg-primary rounded-2xl p-5 mb-3 items-center"
            style={{
              shadowColor: "#0A4370",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <Text className="text-[11px] font-bold text-white/50 tracking-widest uppercase mb-1">
              {t("bookingSuccess.bookingRef")}
            </Text>
            <Text className="text-[32px] font-black text-white tracking-[6px]">
              {booking.bookingRef}
            </Text>
            <View className="flex-row items-center gap-2 mt-2 bg-white/10 px-3 py-1.5 rounded-full">
              <Ionicons
                name="ticket-outline"
                size={13}
                color="rgba(255,255,255,0.8)"
              />
              <Text className="text-[12px] text-white/80 font-semibold">
                {t("booking.seat")} {booking.seatNumber}
              </Text>
            </View>
          </View>

          <SectionCard title={t("bookingSuccess.tripDetails")}>
            <View className="flex-row items-center py-3">
              <View className="flex-1">
                <Text className="text-[22px] font-black text-dark-text leading-tight">
                  {booking.trip?.departureTime}
                </Text>
                <Text className="text-[12px] text-secondary-text mt-0.5">
                  {booking.trip?.from?.city}
                </Text>
              </View>
              <View className="items-center px-4">
                <Ionicons name="arrow-forward" size={16} color="#6A717D" />
                <Text className="text-[11px] text-secondary-text mt-0.5">
                  {booking.trip?.duration}
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-[22px] font-black text-dark-text leading-tight">
                  {booking.trip?.arrivalTime}
                </Text>
                <Text className="text-[12px] text-secondary-text mt-0.5">
                  {booking.trip?.to?.city}
                </Text>
              </View>
            </View>
            <View className="h-px bg-border mb-1" />
            <InfoRow
              label={t("booking.operator")}
              value={booking.trip?.operator ?? ""}
            />
            <InfoRow
              label={t("booking.busType")}
              value={booking.trip?.busType ?? ""}
            />
            <InfoRow
              label={t("booking.dateBooked")}
              value={formatDate(booking.bookedAt)}
            />
          </SectionCard>

          <SectionCard title={t("bookingSuccess.passenger")}>
            <InfoRow
              label={t("booking.name")}
              value={booking.passenger?.fullName ?? ""}
            />
            <InfoRow
              label={t("booking.phone")}
              value={booking.passenger?.phone ?? ""}
            />
            <InfoRow
              label={t("booking.email")}
              value={booking.passenger?.email ?? ""}
            />
          </SectionCard>

          <SectionCard title={t("bookingSuccess.payment")}>
            <InfoRow
              label={t("bookingSuccess.amountPaid")}
              value={`${booking.currency} ${booking.totalPaid?.toLocaleString()}`}
            />
            <View className="flex-row justify-between items-center py-2.5">
              <Text className="text-[13px] text-secondary-text">
                {t("bookingSuccess.status")}
              </Text>
              <View className="flex-row items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full">
                <Ionicons name="checkmark-circle" size={12} color="#38A169" />
                <Text className="text-[11px] font-bold text-success">
                  {t("booking.statusConfirmed")}
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* Print Ticket */}
          {booking?.id && (
            <PrintTicketButton
              ticketId={booking.id}
              ticketData={{
                ticketId: booking.id,
                companyName: booking.trip?.operator,
                passengerName: booking.passenger?.fullName,
                passengerPhone: booking.passenger?.phone,
                boardingStop:
                  booking.trip?.from?.name ?? booking.trip?.from?.city,
                alightingStop: booking.trip?.to?.name ?? booking.trip?.to?.city,
                departureDate: booking.trip?.departureTime
                  ? new Date(booking.trip.departureTime).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )
                  : undefined,
                departureTime: booking.trip?.departureTime
                  ? new Date(booking.trip.departureTime).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    )
                  : undefined,
                seatsCount: 1,
                totalAmount:
                  booking.totalPaid != null
                    ? `${booking.currency} ${booking.totalPaid.toLocaleString()}`
                    : undefined,
                paymentMethod: booking.paymentMethod ?? undefined,
                busPlate: booking.trip?.busType ?? null,
                issuedBy: (booking as any).issuedBy,
              }}
              style={{ marginBottom: 12 }}
            />
          )}

          <TouchableOpacity
            className="bg-primary rounded-2xl h-[54px] items-center justify-center mb-3"
            onPress={() => router.replace("/" as never)}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="search-outline" size={17} color="#FFFFFF" />
              <Text className="text-white text-[15px] font-bold">
                {t("bookingSuccess.bookAnother")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="border border-primary rounded-2xl h-[54px] items-center justify-center"
            onPress={() => router.replace("/(tabs)/trips" as never)}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="ticket-outline" size={17} color="#0A4370" />
              <Text className="text-primary text-[15px] font-bold">
                {t("bookingSuccess.viewMyTrips")}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
