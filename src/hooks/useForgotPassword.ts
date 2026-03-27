import { useState } from "react";
import { forgotPasswordRequest } from "../services/auth.service";

interface State {
  isLoading: boolean;
  error: string | null;
  sent: boolean;
}

/**
 * Handles the forgot-password flow.
 * `sent` flips to true on any 200 response — the backend always returns 200
 * even if the identifier doesn't exist (prevents user enumeration).
 */
export function useForgotPassword() {
  const [state, setState] = useState<State>({
    isLoading: false,
    error: null,
    sent: false,
  });

  const sendResetLink = async (identifier: string) => {
    setState({ isLoading: true, error: null, sent: false });
    try {
      await forgotPasswordRequest({ identifier });
      setState({ isLoading: false, error: null, sent: true });
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.";
      setState({ isLoading: false, error: msg, sent: false });
    }
  };

  const reset = () => setState({ isLoading: false, error: null, sent: false });

  return { ...state, sendResetLink, reset };
}
