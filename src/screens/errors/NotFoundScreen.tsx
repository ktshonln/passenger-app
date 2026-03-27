import { useRouter } from "expo-router";
import React from "react";
import { ErrorScreen } from "../../components/errors/ErrorScreen";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <ErrorScreen
      testID="not-found-screen"
      icon="bus-outline"
      badge="404"
      title="Bus Missed Its Stop"
      subtitle="Looks like this page took a wrong turn. It doesn't exist or may have moved."
      actionLabel="Take Me Home"
      onAction={() => router.replace("/(tabs)")}
      secondaryLabel="Go Back"
      onSecondary={() => router.back()}
    />
  );
}
