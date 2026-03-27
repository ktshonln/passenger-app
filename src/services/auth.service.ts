const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.katisha.app";

// ─── Shared headers ───────────────────────────────────────────────────────────

const MOBILE_HEADERS = {
  "Content-Type": "application/json",
  "X-Client-Type": "mobile",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
}

/** Returned by /auth/login and /auth/verify-phone (mobile) */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface LoginPayload {
  identifier: string; // phone or email
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  phone_number: string; // E.164 e.g. +250788000000
  password: string; // min 8 chars, ≥1 letter + ≥1 number
  email?: string;
}

/** Register does NOT return tokens — OTP verification is required first */
export interface RegisterResponse {
  message: string;
  user_id: string;
  otp_expires_in: number;
}

export interface VerifyPhonePayload {
  user_id: string;
  otp: string;
}

export interface ForgotPasswordPayload {
  identifier: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/** Mobile response from POST /auth/refresh */
export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

/** Thrown when the server signals token reuse — all sessions wiped. */
export class TokenReuseError extends Error {
  constructor() {
    super(
      "Security alert: suspicious activity detected. Please sign in again.",
    );
    this.name = "TokenReuseError";
  }
}

/** Thrown when the account is suspended. */
export class AccountSuspendedError extends Error {
  constructor() {
    super("Your account has been suspended. Please contact support.");
    this.name = "AccountSuspendedError";
  }
}

// ─── Error parser ─────────────────────────────────────────────────────────────

function parseError(status: number): string {
  if (status === 400) return "Reset link is invalid or has already been used.";
  if (status === 401) return "Invalid credentials. Please try again.";
  if (status === 403)
    return "Your account has been suspended. Please contact support.";
  if (status === 409) return "An account with this phone/email already exists.";
  if (status === 410)
    return "Reset link has expired. Please request a new one.";
  if (status === 422)
    return "Password is too weak. Use at least 8 characters with a letter and number.";
  if (status === 429)
    return "Too many attempts. Please wait a while and try again.";
  if (status >= 500) return "Server error. Please try again later.";
  return "Something went wrong. Please try again.";
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function loginRequest(
  payload: LoginPayload,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({
      identifier: payload.identifier,
      password: payload.password,
    }),
  });
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/**
 * POST /auth/register
 * Creates user with status: pending_verification. Sends OTP via SMS.
 * Returns { message, user_id, otp_expires_in } — NO tokens yet.
 */
export async function registerRequest(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone_number: payload.phone_number,
      password: payload.password,
      ...(payload.email ? { email: payload.email } : {}),
    }),
  });
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/**
 * POST /auth/verify-phone — mandatory second step after register.
 * Mobile: returns access_token + refresh_token + user.
 */
export async function verifyPhoneRequest(
  payload: VerifyPhonePayload,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/verify-phone`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({ user_id: payload.user_id, otp: payload.otp }),
  });
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/**
 * POST /auth/forgot-password
 * Always 200. Rate-limited at 3 attempts/hour (429 on breach).
 */
export async function forgotPasswordRequest(
  payload: ForgotPasswordPayload,
): Promise<ForgotPasswordResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({ identifier: payload.identifier }),
  });
  if (res.status === 429) throw new Error(parseError(429));
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/**
 * POST /auth/logout — mobile: Authorization: Bearer <token>
 * Server revokes token in DB. Always 204 — idempotent.
 */
export async function logoutRequest(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
  });
  if (res.status !== 204 && !res.ok)
    console.warn("[auth] logout status:", res.status);
}

/**
 * POST /auth/logout-all — mobile: Authorization: Bearer <token>
 * Revokes every refresh_token row for this user across all devices. Always 204.
 */
export async function logoutAllRequest(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/logout-all`, {
    method: "POST",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
  });
  if (res.status !== 204 && !res.ok)
    console.warn("[auth] logout-all status:", res.status);
}

/**
 * POST /auth/reset-password
 * No tokens issued — user must re-login after success.
 * 400 INVALID_TOKEN | 410 TOKEN_EXPIRED | 422 VALIDATION_ERROR
 */
export async function resetPasswordRequest(
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({
      token: payload.token,
      new_password: payload.new_password,
    }),
  });
  if (res.status === 400) throw new Error(parseError(400));
  if (res.status === 410) throw new Error(parseError(410));
  if (res.status === 422) throw new Error(parseError(422));
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/**
 * POST /auth/refresh — mobile only (X-Client-Type: mobile)
 * Refresh token travels in Authorization header, not body.
 * 401 INVALID_REFRESH_TOKEN | 401 TOKEN_REUSE_DETECTED | 403 ACCOUNT_SUSPENDED
 */
export async function refreshRequest(
  refreshToken: string,
): Promise<RefreshResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${refreshToken}` },
  });

  if (res.status === 401) {
    let errorCode = "INVALID_REFRESH_TOKEN";
    try {
      const body = await res.json();
      errorCode = body?.error_code ?? errorCode;
    } catch {
      /* body may be empty */
    }
    if (errorCode === "TOKEN_REUSE_DETECTED") throw new TokenReuseError();
    throw new Error("Session expired. Please sign in again.");
  }

  if (res.status === 403) throw new AccountSuspendedError();
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}
