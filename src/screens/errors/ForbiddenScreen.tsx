import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ErrorScreen } from "../../components/errors/ErrorScreen";

export default function ForbiddenScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <ErrorScreen
      testID="forbidden-screen"
      icon="lock-closed-outline"
      iconColor="#D97706"
      badge={t("errors.forbiddenBadge")}
      title={t("errors.forbiddenTitle")}
      subtitle={t("errors.forbiddenSubtitle")}
      actionLabel={t("errors.forbiddenAction")}
      onAction={() => router.replace("/(tabs)")}
      secondaryLabel={t("common.back")}
      onSecondary={() => router.back()}
    />
  );
}
