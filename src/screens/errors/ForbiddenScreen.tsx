import { useRouter } from "expo-router";
import React from "react";
import { ErrorScreen } from "../../components/errors/ErrorScreen";

export default function ForbiddenScreen() {
  const router = useRouter();
  return (
    <ErrorScreen
      testID="forbidden-screen"
      icon="lock-closed-outline"
      iconColor="#D97706"
      badge="403"
      title="Access Restricted"
      subtitle="You don't have permission to view this page. This area is reserved for specific account types."
      actionLabel="Go to Home"
      onAction={() => router.replace("/(tabs)")}
      secondaryLabel="Go Back"
      onSecondary={() => router.back()}
    />
  );
}
