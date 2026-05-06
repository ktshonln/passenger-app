import { router } from "expo-router";
import { useState } from "react";
import { resetPasswordRequest } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { isStrongPassword } from "../utils/validation";

interface State {
  isLoading: boolean;
  error: string | null;
  done: boolean;
}

export function useResetPassword() {
  const [state, setState] = useState<State>({
    isLoading: false,
    error: null,
    done: false,
  });

  // After reset, server revokes all sessions — clear local auth too

  const resetPassword = async (
    otp: string,
    identifier: string,
    newPassword: string,
  ) => {
    if (!isStrongPassword(newPassword)) {
      setState((s) => ({
        ...s,
        error:
          "Password must be at least 8 characters with a letter and number.",
      }));
      return;
    }
    setState({ isLoading: true, error: null, done: false });
    try {
      await resetPasswordRequest({
        otp,
        identifier,
        new_password: newPassword,
      });
      setState({ isLoading: false, error: null, done: true });
      // Server revoked all sessions — clear local auth state and go to login
      // Small delay so the success screen is visible briefly
      setTimeout(() => {
        useAuthStore.setState({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
        router.replace("/auth/login");
      }, 2000);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.";
      setState({ isLoading: false, error: msg, done: false });
    }
  };

  const clearError = () => setState((s) => ({ ...s, error: null }));

  return { ...state, resetPassword, clearError };
}
