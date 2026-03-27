import { Colors } from "@/constants/colors";
import React, { useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Text,
    TouchableWithoutFeedback
} from "react-native";

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline";
}

export function AuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: AuthButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 4,
    }).start();

  const isPrimary = variant === "primary";
  const isDisabled = disabled || loading;

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          height: 54,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isPrimary
            ? isDisabled
              ? "#7AAED4"
              : Colors.primary
            : "transparent",
          borderWidth: isPrimary ? 0 : 1.5,
          borderColor: Colors.primary,
          // shadow
          shadowColor: isPrimary ? Colors.primary : "transparent",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDisabled ? 0 : 0.28,
          shadowRadius: 12,
          elevation: isPrimary && !isDisabled ? 6 : 0,
        }}
      >
        {loading ? (
          <ActivityIndicator
            color={isPrimary ? Colors.white : Colors.primary}
          />
        ) : (
          <Text
            style={{
              color: isPrimary ? Colors.white : Colors.primary,
              fontSize: 16,
              fontWeight: "700",
              letterSpacing: 0.3,
            }}
          >
            {label}
          </Text>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
