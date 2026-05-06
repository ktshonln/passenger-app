import { useState } from "react";
import { forgotPasswordRequest } from "../services/auth.service";

interface State {
  isLoading: boolean;
  error: string | null;
  sent: boolean;
  /** The identifier that was submitted — pass to reset-password screen */
  sentTo: string;
}

/**
 * Handles the forgot-password flow.
 * `sent` flips to true on any non-429 response — the backend always returns 204
 * regardless of whether the identifier exists (prevents user enumeration).
 */
export function useForgotPassword() {
  const [state, setState] = useState<State>({
    isLoading: false,
    error: null,
    sent: false,
    sentTo: "",
  });

  const sendOtp = async (identifier: string) => {
    setState({ isLoading: true, error: null, sent: false, sentTo: "" });
    try {
      await forgotPasswordRequest({ identifier });
      setState({
        isLoading: false,
        error: null,
        sent: true,
        sentTo: identifier,
      });
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.";
      setState({ isLoading: false, error: msg, sent: false, sentTo: "" });
    }
  };

  const reset = () =>
    setState({ isLoading: false, error: null, sent: false, sentTo: "" });

  return { ...state, sendOtp, reset };
}
