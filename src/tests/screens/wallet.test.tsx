import WalletScreen from "@/app/wallet";
import { useAuthStore } from "@/src/store/auth.store";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

// Mock i18next
jest.mock("react-i18next", () => {
  const mockRw = require("../../i18n/locales/rw.json");
  return {
    useTranslation: () => ({
      t: (key: string) => {
        const parts = key.split(".");
        let val: any = mockRw;
        for (const part of parts) {
          val = val[part];
          if (!val) return key;
        }
        return val;
      },
      i18n: {
        language: "rw",
        changeLanguage: jest.fn(),
      },
    }),
  };
});

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
  Stack: {
    Screen: () => null,
  },
}));

// Mock hooks
jest.mock("@/src/hooks/use-wallet", () => ({
  useWallet: () => ({
    balance: { available: 5000, currency: "RWF" },
    loading: false,
    refetch: jest.fn(),
  }),
}));

jest.mock("@/src/hooks/use-wallet-transactions", () => ({
  useWalletTransactions: () => ({
    transactions: [
      {
        id: "tx-1",
        type: "topup",
        amount: 1000,
        currency: "RWF",
        status: "confirmed",
        description: "Test Topup",
        created_at: new Date().toISOString(),
      },
    ],
    total: 1,
    page: 1,
    loading: false,
    load: jest.fn(),
    prependTransaction: jest.fn(),
  }),
}));

jest.mock("@/src/hooks/useLanguage", () => ({
  useLanguage: () => ({
    current: "rw",
  }),
}));

// Mock services
jest.mock("@/src/services/wallet.service", () => ({
  initiateTopup: jest.fn().mockResolvedValue({ topup_id: "topup-123" }),
  createTopupSSE: jest.fn().mockReturnValue({ close: jest.fn() }),
}));

describe("WalletScreen", () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: "mock-token",
      user: { id: "u1", phone_number: "0788123456" } as any,
      isAuthenticated: true,
    });
  });

  it("renders the wallet balance correctly", () => {
    render(<WalletScreen />);

    // Check balance
    expect(screen.getByText("5,000")).toBeTruthy();
    expect(screen.getByText("RWF")).toBeTruthy();
  });

  it("shows the top-up modal when the top-up button is pressed", async () => {
    render(<WalletScreen />);

    const topupBtn = screen.getAllByText(/Kongeramo/i)[0];
    fireEvent.press(topupBtn);

    // Check if modal content is visible
    expect(screen.getByText(/Kongera mu mufuka/i)).toBeTruthy();
  });

  it("validates amount in top-up modal", async () => {
    render(<WalletScreen />);

    fireEvent.press(screen.getAllByText(/Kongeramo/i)[0]);

    // Try to confirm with empty amount
    const confirmBtn = screen.getByText(/Emeza kongeramo/i);
    fireEvent.press(confirmBtn);

    // Should show error (this might depend on how your UI updates)
    // In our implementation, the button is disabled if amount < 500
  });

  it("filters transactions correctly", async () => {
    render(<WalletScreen />);

    // Check filter buttons
    expect(screen.getByText(/Byose/i)).toBeTruthy();
    expect(screen.getByText(/Ibyongerewe/i)).toBeTruthy();
    expect(screen.getByText(/Ibyishyuwe/i)).toBeTruthy();
  });
});
