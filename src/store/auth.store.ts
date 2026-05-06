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
  TokenReuseError,
  VerifyPhonePayload,
  verifyPhoneRequest,
} from "../services/auth.service";

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
  verifyPassword: (password: string) => Promise<boolean>;
  /** Returns the login_identifier from verify-phone for pre-filling login */
  verifyPhone: (payload: VerifyPhonePayload) => Promise<string>;
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

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { access_token, refresh_token, user } =
            await loginRequest(payload);
          setAuthToken(access_token);
          set({
            token: access_token,
            refreshToken: refresh_token,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (e: unknown) {
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
          });
          return login_identifier;
        } catch (e: unknown) {
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
          const { access_token, refresh_token } =
            await refreshRequest(refreshToken);
          setAuthToken(access_token);
          // Replace both tokens — old refresh token is now revoked on server
          set({ token: access_token, refreshToken: refresh_token });
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
        set({ pendingUserId: null, otpExpiresIn: null, loginIdentifier: null }),

      verifyPassword: async (password: string) => {
        const { user } = get();
        if (!user) return false;
        try {
          await loginRequest({
            identifier: user.email ?? user.phone_number,
            password,
          });
          return true;
        } catch {
          return false;
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
      },
    },
  ),
);
