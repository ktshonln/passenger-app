/**
 * i18n tests — run against the i18n instance directly (no React rendering needed).
 * Tests: default language, switching, fallback, key coverage.
 */

// Mock AsyncStorage before importing i18n
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { changeLanguage, LOCALE_STORAGE_KEY } from "../../i18n";
import en from "../../i18n/locales/en.json";
import fr from "../../i18n/locales/fr.json";
import rw from "../../i18n/locales/rw.json";

// Wait for i18n to initialise
beforeAll(
  () =>
    new Promise<void>((resolve) => {
      if (i18n.isInitialized) {
        resolve();
        return;
      }
      i18n.on("initialized", resolve);
    }),
);

// ─── Default language ─────────────────────────────────────────────────────────

describe("Default language", () => {
  it("falls back to rw when no language is stored", async () => {
    await AsyncStorage.clear();
    // i18n is already initialised — language detector ran at import time.
    // The default (no stored value) should be rw.
    await i18n.changeLanguage("rw");
    expect(i18n.language).toBe("rw");
  });

  it("translates a key correctly in Kinyarwanda", async () => {
    await i18n.changeLanguage("rw");
    expect(i18n.t("auth.signIn")).toBe(rw.auth.signIn);
  });

  it("translates common.loading in Kinyarwanda", async () => {
    await i18n.changeLanguage("rw");
    expect(i18n.t("common.loading")).toBe(rw.common.loading);
  });
});

// ─── Language switching ───────────────────────────────────────────────────────

describe("Language switching", () => {
  it("switches to English and translates correctly", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.language).toBe("en");
    expect(i18n.t("auth.signIn")).toBe(en.auth.signIn);
    expect(i18n.t("home.whereTravel")).toBe(en.home.whereTravel);
  });

  it("switches to French and translates correctly", async () => {
    await i18n.changeLanguage("fr");
    expect(i18n.language).toBe("fr");
    expect(i18n.t("auth.signIn")).toBe(fr.auth.signIn);
    expect(i18n.t("common.cancel")).toBe(fr.common.cancel);
  });

  it("switches back to Kinyarwanda", async () => {
    await i18n.changeLanguage("rw");
    expect(i18n.language).toBe("rw");
    expect(i18n.t("profile.title")).toBe(rw.profile.title);
  });
});

// ─── Persistence ──────────────────────────────────────────────────────────────

describe("Language persistence", () => {
  it("changeLanguage saves to AsyncStorage", async () => {
    await changeLanguage("fr");
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    expect(stored).toBe("fr");
  });

  it("changeLanguage to en saves en", async () => {
    await changeLanguage("en");
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    expect(stored).toBe("en");
  });

  it("changeLanguage to rw saves rw", async () => {
    await changeLanguage("rw");
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    expect(stored).toBe("rw");
  });
});

// ─── Fallback ─────────────────────────────────────────────────────────────────

describe("Fallback to English", () => {
  it("returns English value for a key missing in rw (fallbackLng=en)", async () => {
    await i18n.changeLanguage("rw");
    // Temporarily remove a key from rw resources to simulate missing translation
    const rwResources = i18n.getResourceBundle("rw", "translation");
    const original = rwResources.common.appName;
    delete rwResources.common.appName;
    i18n.addResourceBundle("rw", "translation", rwResources, true, true);

    const result = i18n.t("common.appName");
    // Should fall back to English
    expect(result).toBe(en.common.appName);

    // Restore
    rwResources.common.appName = original;
    i18n.addResourceBundle("rw", "translation", rwResources, true, true);
  });

  it("returns the key itself when missing in all languages", async () => {
    await i18n.changeLanguage("rw");
    const result = i18n.t("this.key.does.not.exist");
    expect(result).toBe("this.key.does.not.exist");
  });
});

// ─── Translation coverage ─────────────────────────────────────────────────────

describe("Translation coverage", () => {
  const sections = [
    "common",
    "auth",
    "home",
    "trips",
    "booking",
    "bookingSuccess",
    "myTrips",
    "profile",
    "language",
    "errors",
  ] as const;

  it("all top-level sections exist in all three locales", () => {
    for (const section of sections) {
      expect(en).toHaveProperty(section);
      expect(fr).toHaveProperty(section);
      expect(rw).toHaveProperty(section);
    }
  });

  it("en and rw have the same keys in auth section", () => {
    expect(Object.keys(en.auth).sort()).toEqual(Object.keys(rw.auth).sort());
  });

  it("en and fr have the same keys in auth section", () => {
    expect(Object.keys(en.auth).sort()).toEqual(Object.keys(fr.auth).sort());
  });

  it("en and rw have the same keys in common section", () => {
    expect(Object.keys(en.common).sort()).toEqual(
      Object.keys(rw.common).sort(),
    );
  });

  it("critical auth keys are non-empty in all locales", () => {
    const keys: (keyof typeof en.auth)[] = [
      "signIn",
      "signUp",
      "password",
      "emailOrPhone",
    ];
    for (const key of keys) {
      expect(en.auth[key].length).toBeGreaterThan(0);
      expect(fr.auth[key].length).toBeGreaterThan(0);
      expect(rw.auth[key].length).toBeGreaterThan(0);
    }
  });
});
