import { useState } from "react";
import { resetPasswordRequest } from "../services/auth.service";
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

  const resetPassword = async (token: string, newPassword: string) => {
    // Client-side strength check before hitting the network
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
      await resetPasswordRequest({ token, new_password: newPassword });
      // Success — no tokens issued, user must re-login
      setState({ isLoading: false, error: null, done: true });
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
