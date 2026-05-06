import { useAuthStore } from "../store/auth.store";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const pendingUserId = useAuthStore((s) => s.pendingUserId);
  const otpExpiresIn = useAuthStore((s) => s.otpExpiresIn);
  const loginIdentifier = useAuthStore((s) => s.loginIdentifier);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const verifyPhone = useAuthStore((s) => s.verifyPhone);
  const refresh = useAuthStore((s) => s.refresh);
  const logout = useAuthStore((s) => s.logout);
  const logoutAll = useAuthStore((s) => s.logoutAll);
  const clearError = useAuthStore((s) => s.clearError);
  const clearPending = useAuthStore((s) => s.clearPending);

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isLoading,
    error,
    pendingUserId,
    otpExpiresIn,
    loginIdentifier,
    login,
    register,
    verifyPhone,
    refresh,
    logout,
    logoutAll,
    clearError,
    clearPending,
  };
}
