import { useTranslation } from "react-i18next";
import { changeLanguage, Locale, SUPPORTED_LOCALES } from "../i18n";

export const LANGUAGE_META: Record<
  Locale,
  { label: string; native: string; badge: string }
> = {
  rw: { label: "Kinyarwanda", native: "Ikinyarwanda", badge: "RW" },
  en: { label: "English", native: "English", badge: "EN" },
  fr: { label: "French", native: "Français", badge: "FR" },
};

export function useLanguage() {
  const { i18n } = useTranslation();
  const current = (i18n.language ?? "rw") as Locale;

  const setLanguage = async (locale: Locale) => {
    await changeLanguage(locale);
  };

  return {
    current,
    setLanguage,
    languages: SUPPORTED_LOCALES,
    meta: LANGUAGE_META,
    currentMeta: LANGUAGE_META[current] ?? LANGUAGE_META.rw,
  };
}
