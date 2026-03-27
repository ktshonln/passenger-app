import { useRouter } from "expo-router";
import { useCallback } from "react";
import { AppError } from "../errors/AppError";

/**
 * Returns a handler that maps an AppError to the correct error screen.
 * Use inside async callbacks after API calls.
 *
 * @example
 * const handleError = useApiError();
 * try { await someApiCall(); }
 * catch (e) { handleError(e); }
 */
export function useApiError() {
  const router = useRouter();

  return useCallback(
    (error: unknown, onRetry?: () => void) => {
      if (!(error instanceof AppError)) return;

      if (error.isForbidden) {
        router.push("/error/403");
        return;
      }
      if (error.isNotFound) {
        router.push("/+not-found");
        return;
      }
      if (error.isServerError) {
        // Pass retry callback via query param key — screen reads from store
        router.push("/error/500");
        return;
      }
      // Network errors and unknowns surface inline — don't navigate away
    },
    [router],
  );
}
