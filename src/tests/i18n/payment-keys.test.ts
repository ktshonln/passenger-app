/**
 * Tests that all payment and booking i18n keys exist in all 3 locales.
 */

import en from "../../i18n/locales/en.json";
import fr from "../../i18n/locales/fr.json";
import rw from "../../i18n/locales/rw.json";

const REQUIRED_BOOKING_KEYS = [
  "confirmPassword",
  "confirmPasswordDesc",
  "passwordIncorrect",
  "choosePayment",
  "choosePaymentDesc",
  "momoTitle",
  "momoDesc",
  "airtelTitle",
  "airtelDesc",
  "cardTitle",
  "cardDesc",
  "enterMomoNumber",
  "enterAirtelNumber",
  "cardNumber",
  "cardExpiry",
  "cardCvv",
  "cardHolder",
  "processing",
  "payNow",
  "securePayment",
];

const REQUIRED_HOME_KEYS = [
  "tabTitle",
  "goodMorning",
  "goodAfternoon",
  "goodEvening",
  "featuredCompanies",
  "popularRoutes",
  "recommendedForYou",
  "promoTitle",
  "promoBtn",
  "bookNow",
  "viewAll",
];

const REQUIRED_SEARCH_KEYS = [
  "title",
  "subtitle",
  "filters",
  "sortBy",
  "sortPrice",
  "sortTime",
  "sortDuration",
  "sortRating",
  "busType",
  "allTypes",
  "company",
  "allCompanies",
  "results",
  "noResults",
  "clearFilters",
  "applyFilters",
  "recentSearches",
  "clearAll",
  "rebook",
];

function checkKeys(
  locale: Record<string, any>,
  section: string,
  keys: string[],
  localeName: string,
) {
  const sectionObj = locale[section] ?? {};
  for (const key of keys) {
    it(`[${localeName}] booking.${key} exists`, () => {
      expect(sectionObj[key]).toBeDefined();
      expect(typeof sectionObj[key]).toBe("string");
      expect(sectionObj[key].length).toBeGreaterThan(0);
    });
  }
}

describe("booking i18n keys", () => {
  checkKeys(en, "booking", REQUIRED_BOOKING_KEYS, "en");
  checkKeys(rw, "booking", REQUIRED_BOOKING_KEYS, "rw");
  checkKeys(fr, "booking", REQUIRED_BOOKING_KEYS, "fr");
});

describe("home i18n keys", () => {
  checkKeys(en, "home", REQUIRED_HOME_KEYS, "en");
  checkKeys(rw, "home", REQUIRED_HOME_KEYS, "rw");
  checkKeys(fr, "home", REQUIRED_HOME_KEYS, "fr");
});

describe("search i18n keys", () => {
  checkKeys(en, "search", REQUIRED_SEARCH_KEYS, "en");
  checkKeys(rw, "search", REQUIRED_SEARCH_KEYS, "rw");
  checkKeys(fr, "search", REQUIRED_SEARCH_KEYS, "fr");
});

describe("i18n key parity across locales", () => {
  it("en and rw have the same booking keys", () => {
    const enKeys = Object.keys((en as any).booking ?? {}).sort();
    const rwKeys = Object.keys((rw as any).booking ?? {}).sort();
    expect(enKeys).toEqual(rwKeys);
  });

  it("en and fr have the same booking keys", () => {
    const enKeys = Object.keys((en as any).booking ?? {}).sort();
    const frKeys = Object.keys((fr as any).booking ?? {}).sort();
    expect(enKeys).toEqual(frKeys);
  });

  it("en and rw have the same search keys", () => {
    const enKeys = Object.keys((en as any).search ?? {}).sort();
    const rwKeys = Object.keys((rw as any).search ?? {}).sort();
    expect(enKeys).toEqual(rwKeys);
  });

  it("en and fr have the same search keys", () => {
    const enKeys = Object.keys((en as any).search ?? {}).sort();
    const frKeys = Object.keys((fr as any).search ?? {}).sort();
    expect(enKeys).toEqual(frKeys);
  });
});
