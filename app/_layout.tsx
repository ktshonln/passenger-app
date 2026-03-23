import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

export default function RootLayout() {
  return (
    <>
      <Stack>
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
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
