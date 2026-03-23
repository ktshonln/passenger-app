import { createBooking, Trip } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType = "default",
  icon,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-[11px] font-bold text-secondary-text mb-1.5 tracking-widest uppercase">
        {label}
      </Text>
      <View
        className={`flex-row items-center rounded-xl bg-background h-[52px] px-3.5 border ${
          focused
            ? "border-primary bg-white"
            : error
              ? "border-danger bg-red-50"
              : "border-border"
        }`}
      >
        <Ionicons
          name={icon}
          size={17}
          color={focused ? "#0A4370" : "#A0A8B4"}
          style={{ marginRight: 10 }}
        />
        <TextInput
          className="flex-1 text-[15px] text-dark-text"
          placeholder={placeholder}
          placeholderTextColor="#A0A8B4"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          autoCorrect={false}
        />
      </View>
      {!!error && (
        <View className="flex-row items-center gap-1 mt-1">
          <Ionicons name="alert-circle-outline" size={12} color="#E53E3E" />
          <Text className="text-[11px] text-danger">{error}</Text>
        </View>
      )}
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
      className="bg-white rounded-2xl mb-4 overflow-hidden"
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
      <View className="p-4">{children}</View>
    </View>
  );
}

export default function BookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ trip: string }>();
  const trip: Trip = JSON.parse(params.trip ?? "{}");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!phone.trim()) e.phone = "Phone number is required";
    else if (!/^\+?[\d\s\-]{7,15}$/.test(phone.trim()))
      e.phone = "Enter a valid phone number";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleConfirm() {
    if (!validate()) return;
    setLoading(true);
    try {
      const booking = await createBooking(trip, { fullName, phone, email });
      router.replace({
        pathname: "/booking-success" as never,
        params: { booking: JSON.stringify(booking) },
      });
    } catch {
      setErrors({ submit: "Booking failed. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const total = (trip.price ?? 0) + 50;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      {/* Header */}
      <View
        className="bg-primary px-5 pb-5"
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1.5 mb-3"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.7)" />
          <Text className="text-[13px] text-white/70 font-medium">Back</Text>
        </TouchableOpacity>
        <Text className="text-[22px] font-black text-white">
          Passenger Details
        </Text>
        <Text className="text-[13px] text-white/60 mt-1">
          Complete your booking
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Trip Summary */}
        <SectionCard title="Trip Summary">
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text className="text-[22px] font-black text-dark-text leading-tight">
                {trip.departureTime}
              </Text>
              <Text className="text-[12px] text-secondary-text mt-0.5">
                {trip.from?.city}
              </Text>
            </View>
            <View className="items-center px-4">
              <Ionicons name="arrow-forward" size={16} color="#6A717D" />
              <Text className="text-[11px] text-secondary-text mt-0.5">
                {trip.duration}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-[22px] font-black text-dark-text leading-tight">
                {trip.arrivalTime}
              </Text>
              <Text className="text-[12px] text-secondary-text mt-0.5">
                {trip.to?.city}
              </Text>
            </View>
          </View>
          <View className="h-px bg-border mt-3 mb-3" />
          <View className="flex-row justify-between items-center">
            <Text className="text-[13px] text-secondary-text">
              {trip.operator} · {trip.busType}
            </Text>
            <Text className="text-[15px] font-black text-primary">
              {trip.currency} {trip.price?.toLocaleString()}
            </Text>
          </View>
        </SectionCard>

        {/* Passenger Form */}
        <SectionCard title="Passenger Info">
          <Field
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
            icon="person-outline"
          />
          <Field
            label="Phone Number"
            placeholder="+254 700 000 000"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            keyboardType="phone-pad"
            icon="call-outline"
          />
          <Field
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            icon="mail-outline"
          />
        </SectionCard>

        {/* Price Breakdown */}
        <SectionCard title="Price Breakdown">
          <View className="flex-row justify-between mb-2.5">
            <Text className="text-[13px] text-secondary-text">
              Ticket (1 passenger)
            </Text>
            <Text className="text-[13px] text-dark-text font-semibold">
              {trip.currency} {trip.price?.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2.5">
            <Text className="text-[13px] text-secondary-text">Service fee</Text>
            <Text className="text-[13px] text-dark-text font-semibold">
              {trip.currency} 50
            </Text>
          </View>
          <View className="h-px bg-border my-2" />
          <View className="flex-row justify-between items-center">
            <Text className="text-[14px] font-bold text-dark-text">Total</Text>
            <Text className="text-[17px] font-black text-primary">
              {trip.currency} {total.toLocaleString()}
            </Text>
          </View>
        </SectionCard>

        {!!errors.submit && (
          <View className="flex-row items-center gap-2 bg-red-50 border border-danger rounded-xl p-3 mb-4">
            <Ionicons name="alert-circle-outline" size={16} color="#E53E3E" />
            <Text className="text-[13px] text-danger flex-1">
              {errors.submit}
            </Text>
          </View>
        )}

        <TouchableOpacity
          className={`bg-primary rounded-2xl h-[54px] items-center justify-center ${loading ? "opacity-70" : ""}`}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Ionicons name="lock-closed-outline" size={17} color="#FFFFFF" />
              <Text className="text-white text-[15px] font-bold">
                Confirm Booking
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
