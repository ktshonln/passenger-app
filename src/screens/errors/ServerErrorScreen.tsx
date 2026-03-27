import { Colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import React from "react";
import { ErrorScreen } from "../../components/errors/ErrorScreen";

interface Props {
  onRetry?: () => void;
}

export default function ServerErrorScreen({ onRetry }: Props) {
  const router = useRouter();
  return (
    <ErrorScreen
      testID="server-error-screen"
      icon="cloud-offline-outline"
      iconColor={Colors.error}
      badge="500"
      title="Something Went Wrong"
      subtitle="Our servers hit a bump in the road. We're on it — please try again in a moment."
      actionLabel="Try Again"
      onAction={onRetry ?? (() => router.replace("/(tabs)"))}
      secondaryLabel="Go to Home"
      onSecondary={() => router.replace("/(tabs)")}
    />
  );
}
