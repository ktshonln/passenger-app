import { setAuthToken } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
    AccountSuspendedError,
    AuthUser,
    LoginPayload,
    loginRequest,
    logoutAllRequest,
    logoutRequest,
    refreshRequest,
    RegisterPayload,
    registerRequest,
    setRefreshCallback,
    TokenReuseError,
    Verify2FAPayload,
    verify2FARequest,
    VerifyLoginPayload,
    verifyLoginRequest,
    VerifyPhonePayload,
    verifyPhoneRequest,
} from "../services/auth.service";
import { validatePassword } from "../services/user.service";

// ─── State shape ──────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  token: string | null; // access token
  refreshToken: string | null; // refresh token — persisted securely
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingUserId: string | null;
  otpExpiresIn: number | null;
  /** Returned by verify-phone — pre-fill the login screen with this identifier */
  loginIdentifier: string | null;
  /** Password used for registration — pre-fill the login screen with this */
  loginPassword: string | null;
  /** Purpose of the pending login verification */
  pendingLoginPurpose: "verification" | "2fa" | "phone_verification" | null;
  /** Channel to send OTP for login verification */
  pendingLoginChannel: "phone" | "email" | null;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  /**
   * Silent token refresh — mobile only.
   * Sends refresh token in Authorization header.
   * On TOKEN_REUSE_DETECTED or ACCOUNT_SUSPENDED → force logout.
   * Returns true if refresh succeeded, false if session is gone.
   */
  refresh: () => Promise<boolean>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  clearError: () => void;
  clearPending: () => void;
  setUser: (user: Partial<AuthUser>) => void;
  verifyPassword: (password: string) => Promise<boolean>;
  /** Returns the login_identifier from verify-phone for pre-filling login */
  verifyPhone: (payload: VerifyPhonePayload) => Promise<string>;
  verifyLogin: (payload: VerifyLoginPayload) => Promise<void>;
  verify2fa: (payload: Verify2FAPayload) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clearLocalAuth(set: (s: Partial<AuthState>) => void) {
  setAuthToken("");
  set({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
  });
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      pendingUserId: null,
      otpExpiresIn: null,
      loginIdentifier: null,
      loginPassword: null,
      pendingLoginPurpose: null,
      pendingLoginChannel: null,

      login: async (payload) => {
        console.log("[auth.store] Login called with payload:", JSON.stringify(payload, null, 2));
        set({
          isLoading: true,
          error: null,
          loginPassword: null,
          loginIdentifier: null,
          pendingLoginPurpose: null,
          pendingLoginChannel: null,
        });
        try {
          const result = await loginRequest(payload);
          console.log("[auth.store] loginRequest returned:", JSON.stringify(result, null, 2));

          if ("access_token" in result) {
            // Normal successful login
            console.log("[auth.store] Access token found, setting authenticated");
            const { access_token, refresh_token, user } = result;
            setAuthToken(access_token);
            set({
              token: access_token,
              refreshToken: refresh_token,
              user,
              isAuthenticated: true,
              isLoading: false,
              pendingLoginPurpose: null,
              pendingLoginChannel: null,
            });
          } else if ("requires_verification" in result) {
            // Account pending verification
            console.log("[auth.store] Requires verification");
            const { user_id, channel, expires_in } = result;
            set({
              pendingUserId: user_id,
              otpExpiresIn: expires_in,
              pendingLoginPurpose: "verification",
              pendingLoginChannel: channel,
              isLoading: false,
            });
          } else if ("requires_2fa" in result) {
            // 2FA required
            console.log("[auth.store] Requires 2FA");
            const { user_id, expires_in } = result;
            set({
              pendingUserId: user_id,
              otpExpiresIn: expires_in,
              pendingLoginPurpose: "2fa",
              pendingLoginChannel: null,
              isLoading: false,
            });
          }
        } catch (e: unknown) {
          console.error("[auth.store] Login error:", e);
          const msg = e instanceof Error ? e.message : "Login failed.";
          set({ error: msg, isLoading: false });
          throw e;
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { user_id, otp_expires_in } = await registerRequest(payload);
          set({
            pendingUserId: user_id,
            otpExpiresIn: otp_expires_in,
            loginPassword: payload.password,
            pendingLoginPurpose: "phone_verification",
            isLoading: false,
          });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Registration failed.";
          set({ error: msg, isLoading: false });
          throw e;
        }
      },

      verifyPhone: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { login_identifier } = await verifyPhoneRequest(payload);
          set({
            isLoading: false,
            pendingUserId: null,
            otpExpiresIn: null,
            loginIdentifier: login_identifier,
            pendingLoginPurpose: null,
          });
          return login_identifier;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Verification failed.";
          set({ error: msg, isLoading: false });
          throw e;
        }
      },

      verifyLogin: async (payload) => {
        console.log("[auth.store] verifyLogin called with payload:", JSON.stringify(payload, null, 2));
        set({ isLoading: true, error: null });
        try {
          const result = await verifyLoginRequest(payload);
          console.log("[auth.store] verifyLoginRequest returned:", JSON.stringify(result, null, 2));
          const { access_token, refresh_token, user } = result;
          setAuthToken(access_token);
          set({
            token: access_token,
            refreshToken: refresh_token,
            user,
            isAuthenticated: true,
            isLoading: false,
            pendingUserId: null,
            otpExpiresIn: null,
            pendingLoginPurpose: null,
          });
        } catch (e: unknown) {
          console.error("[auth.store] verifyLogin error:", e);
          const msg = e instanceof Error ? e.message : "Verification failed.";
          set({ error: msg, isLoading: false });
          throw e;
        }
      },

      verify2fa: async (payload) => {
        console.log("[auth.store] verify2fa called with payload:", JSON.stringify(payload, null, 2));
        set({ isLoading: true, error: null });
        try {
          const result = await verify2FARequest(payload);
          console.log("[auth.store] verify2FARequest returned:", JSON.stringify(result, null, 2));
          const { access_token, refresh_token, user } = result;
          setAuthToken(access_token);
          set({
            token: access_token,
            refreshToken: refresh_token,
            user,
            isAuthenticated: true,
            isLoading: false,
            pendingUserId: null,
            otpExpiresIn: null,
            pendingLoginPurpose: null,
          });
        } catch (e: unknown) {
          console.error("[auth.store] verify2fa error:", e);
          const msg = e instanceof Error ? e.message : "Verification failed.";
          set({ error: msg, isLoading: false });
          throw e;
        }
      },

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          clearLocalAuth(set);
          return false;
        }
        try {
          const { access_token, refresh_token } = await refreshRequest(refreshToken);
          setAuthToken(access_token);
          // Replace both tokens — old refresh token is now revoked on server
          set({
            token: access_token,
            refreshToken: refresh_token,
          });
          return true;
        } catch (e: unknown) {
          if (e instanceof TokenReuseError) {
            // Security event — wipe everything, show specific message
            setAuthToken("");
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: e.message,
            });
            return false;
          }
          if (e instanceof AccountSuspendedError) {
            setAuthToken("");
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: e.message,
            });
            return false;
          }
          // Plain expiry or network error — clear session
          clearLocalAuth(set);
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        const { refreshToken } = get();
        // API spec: send refresh token in Authorization header
        if (refreshToken) await logoutRequest(refreshToken);
        clearLocalAuth(set);
      },

      logoutAll: async () => {
        set({ isLoading: true });
        const { refreshToken } = get();
        if (refreshToken) await logoutAllRequest(refreshToken);
        clearLocalAuth(set);
      },

      clearError: () => set({ error: null }),
      clearPending: () =>
        set({
          pendingUserId: null,
          otpExpiresIn: null,
          loginIdentifier: null,
          loginPassword: null,
          pendingLoginPurpose: null,
          pendingLoginChannel: null,
        }),

      setUser: (user: Partial<AuthUser>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : null,
        })),

      verifyPassword: async (password: string) => {
        const { user, token } = get();
        if (!user || !token) return null;
        try {
          const result = await validatePassword(token, {
            password,
            action: "purchase_ticket",
          });
          return result.sudoToken;
        } catch (error) {
          if (process.env.NODE_ENV !== "test") {
            console.error("[verifyPassword] Error:", error);
          }
          return null;
        }
      },
    }),
    {
      name: "katisha-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // Restore the in-memory auth token after AsyncStorage rehydration
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
        // Set up refresh callback
        setRefreshCallback(() => useAuthStore.getState().refresh());
      },
    },
  ),
);
