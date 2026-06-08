import { act } from "react";
import * as authService from "../../services/auth.service";
import { useAuthStore } from "../../store/auth.store";

jest.mock("../../services/auth.service");
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/lib/api", () => ({ setAuthToken: jest.fn() }));

const mockLoginRequest = authService.loginRequest as jest.MockedFunction<
  typeof authService.loginRequest
>;
const mockRegisterRequest = authService.registerRequest as jest.MockedFunction<
  typeof authService.registerRequest
>;
const mockVerifyPhoneRequest =
  authService.verifyPhoneRequest as jest.MockedFunction<
    typeof authService.verifyPhoneRequest
  >;

const MOCK_USER: authService.AuthUser = {
  id: "u1",
  first_name: "Jane",
  last_name: "Doe",
  phone_number: "+254700000000",
  email: "jane@example.com",
};

const MOCK_AUTH_RESPONSE: authService.AuthResponse = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  user: MOCK_USER,
};

const MOCK_REGISTER_RESPONSE: authService.RegisterResponse = {
  message: "OTP sent to +254700***000. Please verify your phone.",
  user_id: "u1",
  otp_expires_in: 300,
};

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    pendingUserId: null,
    otpExpiresIn: null,
  });
  jest.clearAllMocks();
});

// ─── login ────────────────────────────────────────────────────────────────────

describe("auth.store — login", () => {
  it("sets token and user on successful login", async () => {
    mockLoginRequest.mockResolvedValueOnce(MOCK_AUTH_RESPONSE);

    await act(async () => {
      await useAuthStore
        .getState()
        .login({ identifier: "jane@example.com", password: "pass1234" });
    });

    const state = useAuthStore.getState();
    expect(state.token).toBe("test-access-token");
    expect(state.user?.email).toBe("jane@example.com");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("sets error and stays unauthenticated on failure", async () => {
    mockLoginRequest.mockRejectedValueOnce(
      new Error("Invalid credentials. Please try again."),
    );

    await act(async () => {
      try {
        await useAuthStore
          .getState()
          .login({ identifier: "bad@example.com", password: "wrong" });
      } catch {
        /* expected */
      }
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.error).toBe("Invalid credentials. Please try again.");
  });
});

// ─── register ─────────────────────────────────────────────────────────────────

describe("auth.store — register", () => {
  it("sets pendingUserId and does NOT authenticate", async () => {
    mockRegisterRequest.mockResolvedValueOnce(MOCK_REGISTER_RESPONSE);

    await act(async () => {
      await useAuthStore.getState().register({
        first_name: "Jane",
        last_name: "Doe",
        phone_number: "+254700000000",
        password: "pass1234",
      });
    });

    const state = useAuthStore.getState();
    expect(state.pendingUserId).toBe("u1");
    expect(state.otpExpiresIn).toBe(300);
    expect(state.isAuthenticated).toBe(false); // not authenticated yet
    expect(state.token).toBeNull();
  });

  it("sets error on registration failure", async () => {
    mockRegisterRequest.mockRejectedValueOnce(
      new Error("An account with this phone number already exists."),
    );

    await act(async () => {
      try {
        await useAuthStore.getState().register({
          first_name: "Jane",
          last_name: "Doe",
          phone_number: "+254700000000",
          password: "pass1234",
        });
      } catch {
        /* expected */
      }
    });

    expect(useAuthStore.getState().error).toBe(
      "An account with this phone number already exists.",
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

// ─── verifyPhone ──────────────────────────────────────────────────────────────

describe("auth.store — verifyPhone", () => {
  it("clears pending state and sets loginIdentifier on correct OTP", async () => {
    mockVerifyPhoneRequest.mockResolvedValueOnce({
      message: "Phone verified",
      login_identifier: "+254700000000",
    });
    useAuthStore.setState({ pendingUserId: "u1", otpExpiresIn: 300 });

    let result = "";
    await act(async () => {
      result = await useAuthStore
        .getState()
        .verifyPhone({ user_id: "u1", otp: "123456" });
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loginIdentifier).toBe("+254700000000");
    expect(result).toBe("+254700000000");
    expect(state.pendingUserId).toBeNull();
    expect(state.otpExpiresIn).toBeNull();
  });

  it("sets error on wrong OTP", async () => {
    mockVerifyPhoneRequest.mockRejectedValueOnce(
      new Error("Invalid OTP. Please check your SMS and try again."),
    );
    useAuthStore.setState({ pendingUserId: "u1" });

    await act(async () => {
      try {
        await useAuthStore
          .getState()
          .verifyPhone({ user_id: "u1", otp: "000000" });
      } catch {
        /* expected */
      }
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().error).toBe(
      "Invalid OTP. Please check your SMS and try again.",
    );
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe("auth.store — logout", () => {
  it("clears auth state on logout", async () => {
    useAuthStore.setState({
      user: MOCK_USER,
      token: "abc",
      isAuthenticated: true,
    });

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
