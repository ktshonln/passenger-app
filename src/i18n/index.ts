import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import rw from "./locales/rw.json";

export type Locale = "rw" | "en" | "fr";
export const SUPPORTED_LOCALES: Locale[] = ["rw", "en", "fr"];
export const LOCALE_STORAGE_KEY = "katisha_language";

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const saved = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      callback(
        saved && SUPPORTED_LOCALES.includes(saved as Locale) ? saved : "rw",
      );
    } catch {
      callback("rw");
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    try {
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, lang);
    } catch {
      /* non-blocking */
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      rw: { translation: rw },
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });

export default i18n;

/** Change language and persist to AsyncStorage */
export async function changeLanguage(locale: Locale): Promise<void> {
  await i18n.changeLanguage(locale);
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
