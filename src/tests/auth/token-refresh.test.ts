import { act } from "react";
import {
    AccountSuspendedError,
    refreshRequest,
    TokenReuseError,
} from "../../services/auth.service";
import { useAuthStore } from "../../store/auth.store";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@/lib/api", () => ({ setAuthToken: jest.fn() }));

beforeEach(() => {
  mockFetch.mockClear();
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    pendingUserId: null,
    otpExpiresIn: null,
  });
});

// ─── refreshRequest — API path ────────────────────────────────────────────────

describe("refreshRequest — API", () => {
  it("sends refresh token in Authorization header with X-Client-Type: mobile", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new-access",
        refresh_token: "new-refresh",
        token_type: "Bearer",
        expires_in: 900,
      }),
    });

    const result = await refreshRequest("old-refresh-token");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/auth/refresh");
    expect(options.method).toBe("POST");
    expect(options.headers["Authorization"]).toBe("Bearer old-refresh-token");
    expect(options.headers["X-Client-Type"]).toBe("mobile");
    expect(result.access_token).toBe("new-access");
    expect(result.refresh_token).toBe("new-refresh");
    expect(result.token_type).toBe("Bearer");
    expect(result.expires_in).toBe(900);
  });

  it("throws plain error on 401 INVALID_REFRESH_TOKEN", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error_code: "INVALID_REFRESH_TOKEN" }),
    });
    await expect(refreshRequest("expired-token")).rejects.toThrow(
      "Session expired. Please sign in again.",
    );
  });

  it("throws TokenReuseError on 401 TOKEN_REUSE_DETECTED", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error_code: "TOKEN_REUSE_DETECTED" }),
    });
    await expect(refreshRequest("reused-token")).rejects.toBeInstanceOf(
      TokenReuseError,
    );
  });

  it("throws AccountSuspendedError on 403", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(refreshRequest("valid-token")).rejects.toBeInstanceOf(
      AccountSuspendedError,
    );
  });

  it("does NOT send a request body (mobile uses header only)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "a",
        refresh_token: "r",
        token_type: "Bearer",
        expires_in: 900,
      }),
    });
    await refreshRequest("token");
    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBeUndefined();
  });
});

// ─── auth.store — refresh action ──────────────────────────────────────────────

describe("auth.store — refresh()", () => {
  it("updates access and refresh tokens on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new-access",
        refresh_token: "new-refresh",
        token_type: "Bearer",
        expires_in: 900,
      }),
    });
    useAuthStore.setState({
      token: "old-access",
      refreshToken: "old-refresh",
      isAuthenticated: true,
      user: {
        id: "u1",
        first_name: "Jane",
        last_name: "Doe",
        phone_number: "+254700000000",
      },
    });

    let result: boolean;
    await act(async () => {
      result = await useAuthStore.getState().refresh();
    });

    expect(result!).toBe(true);
    expect(useAuthStore.getState().token).toBe("new-access");
    expect(useAuthStore.getState().refreshToken).toBe("new-refresh");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("clears session and returns false on expired token (401)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error_code: "INVALID_REFRESH_TOKEN" }),
    });
    useAuthStore.setState({
      token: "t",
      refreshToken: "r",
      isAuthenticated: true,
    });

    let result: boolean;
    await act(async () => {
      result = await useAuthStore.getState().refresh();
    });

    expect(result!).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it("clears session and sets error message on TOKEN_REUSE_DETECTED", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error_code: "TOKEN_REUSE_DETECTED" }),
    });
    useAuthStore.setState({
      token: "t",
      refreshToken: "r",
      isAuthenticated: true,
    });

    await act(async () => {
      await useAuthStore.getState().refresh();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toContain("suspicious activity");
  });

  it("clears session and sets error message on ACCOUNT_SUSPENDED (403)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
    useAuthStore.setState({
      token: "t",
      refreshToken: "r",
      isAuthenticated: true,
    });

    await act(async () => {
      await useAuthStore.getState().refresh();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toContain("suspended");
  });

  it("returns false immediately if no refresh token stored", async () => {
    useAuthStore.setState({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });

    let result: boolean;
    await act(async () => {
      result = await useAuthStore.getState().refresh();
    });

    expect(result!).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ─── refreshRequest — network failure ────────────────────────────────────────

describe("refreshRequest — network failure", () => {
  it("propagates TypeError when network is down", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(refreshRequest("any-token")).rejects.toThrow(TypeError);
  });
});
