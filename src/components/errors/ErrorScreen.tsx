import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export interface ErrorScreenProps {
  /** Large emoji or icon name */
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle: string;
  /** Primary CTA label */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary CTA label */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Small badge shown above the title, e.g. "404" */
  badge?: string;
  testID?: string;
}

export function ErrorScreen({
  icon,
  iconColor,
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  badge,
  testID,
}: ErrorScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 5,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root} testID={testID}>
      <Animated.View
        style={[styles.content, { opacity, transform: [{ translateY }] }]}
      >
        {/* Icon ring */}
        <View
          style={[
            styles.iconRing,
            iconColor ? { backgroundColor: `${iconColor}15` } : null,
          ]}
        >
          <Ionicons name={icon} size={52} color={iconColor ?? Colors.primary} />
        </View>

        {badge ? <Text style={styles.badge}>{badge}</Text> : null}

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {actionLabel && onAction ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onAction}
            activeOpacity={0.85}
            testID={`${testID}-primary-btn`}
          >
            <Text style={styles.primaryBtnText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {secondaryLabel && onSecondary ? (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onSecondary}
            activeOpacity={0.7}
            testID={`${testID}-secondary-btn`}
          >
            <Text style={styles.secondaryBtnText}>{secondaryLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  content: { alignItems: "center", width: "100%" },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  badge: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.secondaryText,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.darkText,
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.secondaryText,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
    width: "100%",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});
