/**
 * Tests for auth.store verifyPassword action.
 */

import { act } from "react";
import * as authService from "../../services/auth.service";
import * as userService from "../../services/user.service";
import { useAuthStore } from "../../store/auth.store";

// Mock user.service
jest.mock("../../services/user.service");

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/lib/api", () => ({ setAuthToken: jest.fn() }));

const mockValidatePassword = userService.validatePassword as jest.MockedFunction<
  typeof userService.validatePassword
>;

const MOCK_USER: authService.AuthUser = {
  id: "u1",
  first_name: "Jane",
  last_name: "Doe",
  phone_number: "+254700000000",
  email: "jane@example.com",
  user_type: "passenger",
  avatar_path: null,
  org_id: null,
  roles: [],
  status: "active",
  two_factor_enabled: false,
  login_channel: "phone",
  locale: "en",
};
const CORRECT_PASSWORD = "Demo1234";

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: MOCK_USER,
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
  it("returns sudo token for the correct demo password", async () => {
    const mockSudoToken = "mock-sudo-token-1234";
    mockValidatePassword.mockResolvedValue({
      sudoToken: mockSudoToken,
      expiresAt: new Date(Date.now() + 300000).toISOString(),
      expiresIn: 300,
    });
    let result: string | null = null;
    await act(async () => {
      result = await useAuthStore
        .getState()
        .verifyPassword(CORRECT_PASSWORD);
    });
    expect(result).toBe(mockSudoToken);
    expect(mockValidatePassword).toHaveBeenCalledWith("mock_access_token_dev", {
      password: CORRECT_PASSWORD,
      action: "purchase_ticket",
    });
  });

  it("returns null for a wrong password", async () => {
    mockValidatePassword.mockRejectedValue(new Error("Invalid password"));
    let result: string | null = "not-null";
    await act(async () => {
      result = await useAuthStore.getState().verifyPassword("wrongpassword");
    });
    expect(result).toBeNull();
    expect(mockValidatePassword).toHaveBeenCalledWith("mock_access_token_dev", {
      password: "wrongpassword",
      action: "purchase_ticket",
    });
  });

  it("returns null when no user is logged in", async () => {
    useAuthStore.setState({ user: null });
    let result: string | null = "not-null";
    await act(async () => {
      result = await useAuthStore
        .getState()
        .verifyPassword(CORRECT_PASSWORD);
    });
    expect(result).toBeNull();
    expect(mockValidatePassword).not.toHaveBeenCalled();
  });

  it("returns null when no token is present", async () => {
    useAuthStore.setState({ token: null });
    let result: string | null = "not-null";
    await act(async () => {
      result = await useAuthStore
        .getState()
        .verifyPassword(CORRECT_PASSWORD);
    });
    expect(result).toBeNull();
    expect(mockValidatePassword).not.toHaveBeenCalled();
  });

  it("is case-sensitive", async () => {
    mockValidatePassword.mockRejectedValue(new Error("Invalid password"));
    let result: string | null = "not-null";
    await act(async () => {
      result = await useAuthStore
        .getState()
        .verifyPassword(CORRECT_PASSWORD.toLowerCase());
    });
    // Demo password is "Demo1234" — lowercase "demo1234" should fail
    expect(result).toBeNull();
    expect(mockValidatePassword).toHaveBeenCalledWith("mock_access_token_dev", {
      password: CORRECT_PASSWORD.toLowerCase(),
      action: "purchase_ticket",
    });
  });
});
