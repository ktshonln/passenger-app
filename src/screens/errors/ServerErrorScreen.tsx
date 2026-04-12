import { Colors } from "@/constants/colors";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ErrorScreen } from "../../components/errors/ErrorScreen";

interface Props {
  onRetry?: () => void;
}

export default function ServerErrorScreen({ onRetry }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <ErrorScreen
      testID="server-error-screen"
      icon="cloud-offline-outline"
      iconColor={Colors.error}
      badge={t("errors.serverErrorBadge")}
      title={t("errors.serverErrorTitle")}
      subtitle={t("errors.serverErrorSubtitle")}
      actionLabel={t("errors.serverErrorAction")}
      onAction={onRetry ?? (() => router.replace("/(tabs)"))}
      secondaryLabel={t("errors.serverErrorSecondary")}
      onSecondary={() => router.replace("/(tabs)")}
    />
  );
}
