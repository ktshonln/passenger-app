import { ErrorBoundary } from "@/src/components/errors/ErrorBoundary";
import "@/src/i18n"; // bootstrap i18n — must be imported before any screen
import { useAuthStore } from "@/src/store/auth.store";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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

      {!isAuthenticated && <Redirect href="/auth/login" />}
      <StatusBar style="light" />
    </ErrorBoundary>
  );
}
