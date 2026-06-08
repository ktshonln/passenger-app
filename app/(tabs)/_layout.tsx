import { Colors } from "@/constants/colors";
import { useLanguage } from "@/src/hooks/useLanguage";
import { Locale } from "@/src/i18n";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const IS_IOS = Platform.OS === "ios";
const BOTTOM = IS_IOS ? 34 : 20;
const PILL_RADIUS = 50;
const CIRCLE_SIZE = 62;
const ACTIVE_BG = "rgba(255,255,255,0.18)";
const ACTIVE_COLOR = "#FFFFFF";
const INACTIVE_COLOR = "rgba(255,255,255,0.58)";
// Semi-transparent blue — same brand color, just let background show through
const PILL_BG = "rgba(10,67,112,0.72)";

const FLAG: Record<string, string> = { rw: "🇷🇼", en: "🇬🇧", fr: "🇫🇷" };

// ─── Language circle ──────────────────────────────────────────────────────────

function LangCircle() {
  const { current, setLanguage, languages, meta } = useLanguage();
  const scale = useRef(new Animated.Value(1)).current;

  const next = (): Locale => {
    const i = languages.indexOf(current);
    return languages[(i + 1) % languages.length];
  };

  const onPress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.88,
        useNativeDriver: true,
        speed: 120,
        bounciness: 0,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 44,
        bounciness: 14,
      }),
    ]).start();
    setLanguage(next());
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.circleOuter, { transform: [{ scale }] }]}>
        <Text style={styles.langFlag}>{FLAG[current] ?? "🌐"}</Text>
        <View style={styles.langBadgeWrap}>
          <Text
            style={styles.langCode}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {meta[current].badge}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.pillOuter}>
        <View style={styles.pillShine} />
        <View style={styles.tabsRow}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label: string = options.title ?? route.name;
            const isFocused = state.index === index;

            const iconMap: Record<
              string,
              {
                on: keyof typeof Ionicons.glyphMap;
                off: keyof typeof Ionicons.glyphMap;
              }
            > = {
              index: { on: "home", off: "home-outline" },
              trips: { on: "ticket", off: "ticket-outline" },
              profile: { on: "person", off: "person-outline" },
            };
            const icons = iconMap[route.name] ?? {
              on: "ellipse",
              off: "ellipse-outline",
            };
            const iconName = isFocused ? icons.on : icons.off;
            const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented)
                navigation.navigate(route.name);
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.8}
                style={[styles.tab, isFocused && styles.tabActive]}
              >
                <Ionicons name={iconName} size={20} color={color} />
                <Text
                  style={[styles.tabLabel, { color }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.65}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <LangCircle />
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t("home.tabTitle") }} />
      <Tabs.Screen name="trips" options={{ title: t("myTrips.title") }} />
      <Tabs.Screen name="profile" options={{ title: t("profile.title") }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: BOTTOM,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // ── Pill ──
  pillOuter: {
    flex: 1,
    borderRadius: PILL_RADIUS,
    overflow: "hidden",
    backgroundColor: PILL_BG,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },

  // 1px top specular — glass shine
  pillShine: {
    position: "absolute",
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    zIndex: 2,
  },

  pillBorder: {
    borderRadius: PILL_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 2,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 40,
    gap: 3,
    overflow: "hidden",
  },

  tabActive: {
    backgroundColor: ACTIVE_BG,
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.1,
    textAlign: "center",
    width: "100%",
  },

  // ── Language circle ──
  circleOuter: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: "hidden",
    backgroundColor: PILL_BG,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },

  langFlag: {
    fontSize: 22,
    lineHeight: 26,
  },

  langBadgeWrap: {
    width: 36,
    alignItems: "center",
  },

  langCode: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
    textAlign: "center",
  },
});
