import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function ModalScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center p-5">
      <Text className="text-2xl font-bold text-dark-text">
        {t("modal.title")}
      </Text>
      <Link href="/" dismissTo className="mt-4 py-4">
        <Text className="text-base text-primary">{t("modal.goToHome")}</Text>
      </Link>
    </View>
  );
}
