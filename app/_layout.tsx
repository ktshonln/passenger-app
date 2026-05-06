import { ErrorBoundary } from "@/src/components/errors/ErrorBoundary";
import "@/src/i18n";
import { useAuthStore } from "@/src/store/auth.store";
import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import "../global.css";

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);
  const segments = useSegments();

  // Wait for Zustand AsyncStorage rehydration before doing anything
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  // Imperative redirect — fires the moment auth state changes
  useEffect(() => {
    if (!hydrated) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isAuthenticated && !inAuthGroup) {
      // Signed out — go to login immediately, replace so back button doesn't return to tabs
      router.replace("/auth/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Signed in — go to home
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, hydrated, segments]);

  // Blank screen while hydrating — prevents flash
  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: "#0A4370" }} />;
  }

  return (
    <ErrorBoundary>
      <Stack>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="trips" options={{ headerShown: false }} />
        <Stack.Screen name="booking" options={{ headerShown: false }} />
        <Stack.Screen
          name="booking-success"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile/change-password"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profile/notifications"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profile/language"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Screen name="error/403" options={{ headerShown: false }} />
        <Stack.Screen name="error/500" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </ErrorBoundary>
  );
}
