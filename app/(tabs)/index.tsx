import { HowItWorks } from "@/components/how-it-works";
import { SearchCard } from "@/components/search/search-card";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 6,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(values: { from: string; to: string; date: string }) {
    router.push({ pathname: "/trips" as never, params: values });
  }

  return (
    <View className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0A4370" />

      {/* Hero header */}
      <View
        style={{ paddingTop: Platform.OS === "android" ? 52 : 64 }}
        className="px-6 pb-8"
      >
        <View className="flex-row items-center gap-2 mb-1">
          <View className="w-7 h-7 rounded-lg bg-white/20 items-center justify-center">
            <Text className="text-white text-xs font-black">K</Text>
          </View>
          <Text className="text-white/70 text-sm font-semibold tracking-widest uppercase">
            Katisha
          </Text>
        </View>
        <Text className="text-white text-3xl font-black tracking-tight leading-tight mt-2">
          Where are you{"\n"}travelling today?
        </Text>
        <Text className="text-white/50 text-sm mt-2 font-medium">
          Search · Book · Board — in seconds
        </Text>
      </View>

      {/* Content sheet */}
      <ScrollView
        className="flex-1 bg-background rounded-t-[32px]"
        contentContainerClassName="flex-grow px-5 pt-6 pb-12"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <SearchCard onSearch={handleSearch} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }} className="mt-8">
          <HowItWorks />
        </Animated.View>
      </ScrollView>
    </View>
  );
}
