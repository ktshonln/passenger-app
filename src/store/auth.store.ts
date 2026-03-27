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

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyPhone: (payload: VerifyPhonePayload) => Promise<void>;
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
          const { access_token, refresh_token, user } =
            await verifyPhoneRequest(payload);
          setAuthToken(access_token);
          set({
            token: access_token,
            refreshToken: refresh_token,
            user,
            isAuthenticated: true,
            isLoading: false,
            pendingUserId: null,
            otpExpiresIn: null,
          });
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
        const { token } = get();
        if (token) await logoutRequest(token);
        clearLocalAuth(set);
      },

      logoutAll: async () => {
        set({ isLoading: true });
        const { token } = get();
        if (token) await logoutAllRequest(token);
        clearLocalAuth(set);
      },

      clearError: () => set({ error: null }),
      clearPending: () => set({ pendingUserId: null, otpExpiresIn: null }),
    }),
    {
      name: "katisha-auth",
      storage: createJSONStorage(() => AsyncStorage),
      // Persist both tokens — access token for immediate use, refresh for silent renewal
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
