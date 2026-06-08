/**
 * Tests that all wallet i18n keys exist in all 3 locales.
 */

import en from "../../i18n/locales/en.json";
import fr from "../../i18n/locales/fr.json";
import rw from "../../i18n/locales/rw.json";

const REQUIRED_WALLET_KEYS = [
  "title",
  "currentBalance",
  "topUp",
  "payment",
  "all",
  "topUps",
  "payments",
  "transaction",
  "transactions",
  "noTransactionsYet",
  "topUpToGetStarted",
  "topUpNow",
  "page",
  "of",
  "topUpWallet",
  "amount",
  "amountPlaceholder",
  "minimum",
  "paymentMethod",
  "mtnMoMo",
  "airtelMoney",
  "phoneNumber",
  "phonePlaceholder",
  "confirmTopUp",
  "waitingForPayment",
  "paymentRequestSentTo",
  "enterPinToConfirm",
  "timeRemaining",
  "topUpSuccessful",
  "added",
  "newBalance",
  "paymentFailed",
  "paymentNotCompleted",
  "tryDifferentMethod",
  "paymentTimedOut",
  "pleaseTryAgain",
  "minimumTopUpAmount",
  "validPhoneNumber",
  "failedToInitiateTopUp",
  "topUpVia",
  "connectionError",
];

const REQUIRED_WALLET_STATUS_KEYS = ["confirmed", "pending", "failed"];

function checkKeys(
  locale: Record<string, any>,
  section: string,
  keys: string[],
  localeName: string,
) {
  const sectionObj = locale[section] ?? {};
  for (const key of keys) {
    it(`[${localeName}] wallet.${key} exists`, () => {
      expect(sectionObj[key]).toBeDefined();
      if (typeof sectionObj[key] === "object") {
        // Status keys are nested
        return;
      }
      expect(typeof sectionObj[key]).toBe("string");
      expect(sectionObj[key].length).toBeGreaterThan(0);
    });
  }
}

function checkNestedKeys(
  locale: Record<string, any>,
  section: string,
  subSection: string,
  keys: string[],
  localeName: string,
) {
  const sectionObj = locale[section]?.[subSection] ?? {};
  for (const key of keys) {
    it(`[${localeName}] wallet.${subSection}.${key} exists`, () => {
      expect(sectionObj[key]).toBeDefined();
      expect(typeof sectionObj[key]).toBe("string");
      expect(sectionObj[key].length).toBeGreaterThan(0);
    });
  }
}

describe("wallet i18n keys", () => {
  checkKeys(en, "wallet", REQUIRED_WALLET_KEYS, "en");
  checkKeys(rw, "wallet", REQUIRED_WALLET_KEYS, "rw");
  checkKeys(fr, "wallet", REQUIRED_WALLET_KEYS, "fr");
});

describe("wallet status i18n keys", () => {
  checkNestedKeys(en, "wallet", "status", REQUIRED_WALLET_STATUS_KEYS, "en");
  checkNestedKeys(rw, "wallet", "status", REQUIRED_WALLET_STATUS_KEYS, "rw");
  checkNestedKeys(fr, "wallet", "status", REQUIRED_WALLET_STATUS_KEYS, "fr");
});
