import { useBookings } from "@/hooks/use-bookings";
import { Booking } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Platform,
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

      {/* Header */}
      <View
        className="bg-primary px-5 pb-5"
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60 }}
      >
        <Text className="text-[22px] font-black text-white">
          Booking Confirmed
        </Text>
        <Text className="text-[13px] text-white/60 mt-1">
          Your seat is secured
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Success icon */}
        <Animated.View
          className="items-center py-5"
          style={{ transform: [{ scale: scaleAnim }] }}
        >
          <View className="w-[72px] h-[72px] rounded-full bg-green-100 items-center justify-center mb-3">
            <Ionicons name="checkmark-circle" size={48} color="#38A169" />
          </View>
          <Text className="text-[19px] font-black text-dark-text">
            Booking Successfull
          </Text>
          <Text className="text-[13px] text-secondary-text mt-1">
            Check your email for the ticket
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Booking ref — ticket card */}
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
              Booking Reference
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
                Seat {booking.seatNumber}
              </Text>
            </View>
          </View>

          {/* Trip details */}
          <SectionCard title="Trip Details">
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
            <InfoRow label="Operator" value={booking.trip?.operator ?? ""} />
            <InfoRow label="Bus Type" value={booking.trip?.busType ?? ""} />
            <InfoRow label="Date Booked" value={formatDate(booking.bookedAt)} />
          </SectionCard>

          {/* Passenger */}
          <SectionCard title="Passenger">
            <InfoRow label="Name" value={booking.passenger?.fullName ?? ""} />
            <InfoRow label="Phone" value={booking.passenger?.phone ?? ""} />
            <InfoRow label="Email" value={booking.passenger?.email ?? ""} />
          </SectionCard>

          {/* Payment */}
          <SectionCard title="Payment">
            <InfoRow
              label="Amount Paid"
              value={`${booking.currency} ${booking.totalPaid?.toLocaleString()}`}
            />
            <View className="flex-row justify-between items-center py-2.5">
              <Text className="text-[13px] text-secondary-text">Status</Text>
              <View className="flex-row items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-full">
                <Ionicons name="checkmark-circle" size={12} color="#38A169" />
                <Text className="text-[11px] font-bold text-success">
                  Confirmed
                </Text>
              </View>
            </View>
          </SectionCard>

          {/* Actions */}
          <TouchableOpacity
            className="bg-primary rounded-2xl h-[54px] items-center justify-center mb-3"
            onPress={() => router.replace("/" as never)}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="search-outline" size={17} color="#FFFFFF" />
              <Text className="text-white text-[15px] font-bold">
                Book Another Trip
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="border border-primary rounded-2xl h-[54px] items-center justify-center"
            onPress={() => router.replace("/(tabs)/explore" as never)}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="ticket-outline" size={17} color="#0A4370" />
              <Text className="text-primary text-[15px] font-bold">
                View My Trips
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
