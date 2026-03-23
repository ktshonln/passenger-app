import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

const STEPS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  step: string;
}[] = [
  {
    icon: "search-outline",
    title: "Search",
    desc: "Enter your route and travel date",
    step: "01",
  },
  {
    icon: "ticket-outline",
    title: "Book",
    desc: "Pick a trip and secure your seat",
    step: "02",
  },
  {
    icon: "bus-outline",
    title: "Board",
    desc: "Show your ticket and hop on",
    step: "03",
  },
];

export function HowItWorks() {
  const anims = useRef(STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      100,
      anims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View>
      <View className="flex-row items-center gap-2 mb-4">
        <View className="flex-1 h-px bg-border" />
        <Text className="text-[11px] font-bold text-secondary-text tracking-widest uppercase">
          How it works
        </Text>
        <View className="flex-1 h-px bg-border" />
      </View>

      <View className="flex-row gap-3">
        {STEPS.map((step, i) => (
          <Animated.View
            key={step.title}
            className="flex-1 bg-white rounded-2xl p-3.5 items-center"
            style={{
              opacity: anims[i],
              transform: [
                {
                  translateY: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
              shadowColor: "#0A4370",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <View className="w-10 h-10 rounded-xl bg-overlay items-center justify-center mb-2.5">
              <Ionicons name={step.icon} size={20} color="#0A4370" />
            </View>
            <Text className="text-[11px] font-black text-dark-text tracking-tight">
              {step.title}
            </Text>
            <Text className="text-[10px] text-secondary-text text-center leading-[14px] mt-0.5">
              {step.desc}
            </Text>
            <Text className="text-[10px] font-black text-primary/30 mt-2 tracking-widest">
              {step.step}
            </Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
