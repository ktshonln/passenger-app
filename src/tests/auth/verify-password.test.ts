/**
 * Tests for auth.store verifyPassword action.
 */

import { act } from "react";
import { DEMO_CREDENTIALS, DEMO_USER } from "../../services/mock.data";
import { useAuthStore } from "../../store/auth.store";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/lib/api", () => ({ setAuthToken: jest.fn() }));

// Force mock mode
process.env.EXPO_PUBLIC_USE_MOCK = "true";

beforeEach(() => {
  useAuthStore.setState({
    user: DEMO_USER,
    token: "mock_access_token_dev",
    refreshToken: "mock_refresh_token_dev",
    isAuthenticated: true,
    isLoading: false,
    error: null,
    pendingUserId: null,
    otpExpiresIn: null,
  });
});

describe("verifyPassword (mock mode)", () => {
  it("returns true for the correct demo password", async () => {
    let result = false;
    await act(async () => {
      result = await useAuthStore
        .getState()
        .verifyPassword(DEMO_CREDENTIALS.password);
    });
    expect(result).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    let result = true;
    await act(async () => {
      result = await useAuthStore.getState().verifyPassword("wrongpassword");
    });
    expect(result).toBe(false);
  });

  it("returns false when no user is logged in", async () => {
    useAuthStore.setState({ user: null });
    let result = true;
    await act(async () => {
      result = await useAuthStore
        .getState()
        .verifyPassword(DEMO_CREDENTIALS.password);
    });
    expect(result).toBe(false);
  });

  it("is case-sensitive", async () => {
    let result = true;
    await act(async () => {
      result = await useAuthStore
        .getState()
        .verifyPassword(DEMO_CREDENTIALS.password.toLowerCase());
    });
    // Demo password is "Demo1234" — lowercase "demo1234" should fail
    expect(result).toBe(false);
  });
});
