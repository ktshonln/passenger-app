const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.katisha.online";

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

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  email?: string;
  locale: "en" | "fr" | "rw";
}

export interface RegisterResponse {
  message: string;
  user_id: string;
  otp_expires_in: number;
}

export interface VerifyPhonePayload {
  user_id: string;
  otp: string;
}

/** Response from POST /auth/verify-phone — no tokens, redirects to login */
export interface VerifyPhoneResponse {
  message: string;
  /** The identifier the user should use to log in (phone or email) */
  login_identifier: string;
}

/** POST /auth/register-device — register FCM token for push notifications */
export interface RegisterDevicePayload {
  fcm_token: string;
  /** Optional: update notification channels */
  notif_channel?: ("sms" | "email" | "app")[];
}

export interface RegisterDeviceResponse {
  message: string;
}

export interface VerifyEmailPayload {
  user_id: string;
  otp: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface VerifyLoginPayload {
  user_id: string;
  otp: string;
}

export interface Verify2FAPayload {
  user_id: string;
  code: string;
}

export interface InviteValidateResponse {
  valid: boolean;
  email?: string;
  expires_at?: string;
}

export interface ForgotPasswordPayload {
  identifier: string;
}

/** Always 204 — no body. Backend never reveals if identifier exists. */
export interface ForgotPasswordResponse {
  sent: true;
}

export interface ResetPasswordPayload {
  otp: string;
  identifier: string;
  new_password: string;
}
// Note: reset-password returns 204 (no body) — all sessions revoked, user must re-login

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export class TokenReuseError extends Error {
  constructor() {
    super(
      "Security alert: suspicious activity detected. Please sign in again.",
    );
    this.name = "TokenReuseError";
  }
}

export class AccountSuspendedError extends Error {
  constructor() {
    super("Your account has been suspended. Please contact support.");
    this.name = "AccountSuspendedError";
  }
}

// ─── Error parser ─────────────────────────────────────────────────────────────

function parseError(status: number): string {
  if (status === 400) return "Request is invalid or has already been used.";
  if (status === 401) return "Invalid credentials. Please try again.";
  if (status === 403)
    return "Your account has been suspended. Please contact support.";
  if (status === 409) return "An account with this phone/email already exists.";
  if (status === 410) return "OTP has expired. Please request a new one.";
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
  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (process.env.EXPO_PUBLIC_USE_MOCK === "true") {
    const {
      DEMO_CREDENTIALS,
      DEMO_AUTH_RESPONSE,
      DEMO_USER,
    } = require("./mock.data");
    if (
      payload.identifier === DEMO_CREDENTIALS.identifier &&
      payload.password === DEMO_CREDENTIALS.password
    ) {
      return DEMO_AUTH_RESPONSE;
    }
    if (
      payload.identifier === DEMO_USER.email ||
      payload.identifier === DEMO_USER.phone_number
    ) {
      if (payload.password === DEMO_CREDENTIALS.password) {
        return DEMO_AUTH_RESPONSE;
      }
      throw new Error("INVALID_CREDENTIALS");
    }
    throw new Error("INVALID_CREDENTIALS");
  }

  // ── Real API ───────────────────────────────────────────────────────────────
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
      locale: payload.locale,
      ...(payload.email ? { email: payload.email } : {}),
    }),
  });
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/** POST /auth/verify-phone — standalone phone verification, NO tokens issued.
 *  On success: activates account, returns login_identifier for pre-filling login.
 *  Direct user to /auth/login with login_identifier pre-filled.
 */
export async function verifyPhoneRequest(
  payload: VerifyPhonePayload,
): Promise<VerifyPhoneResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/verify-phone`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({ user_id: payload.user_id, otp: payload.otp }),
  });
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/** POST /auth/register-device — register FCM token for push notifications.
 *  Call after login. Switches notif_channel to ["app"] automatically.
 */
export async function registerDeviceRequest(
  payload: RegisterDevicePayload,
  accessToken: string,
): Promise<RegisterDeviceResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/register-device`, {
    method: "POST",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`registerDevice failed: ${res.status}`);
  return res.json();
}

/** POST /auth/verify-email — standalone email verification, no tokens. */
export async function verifyEmailRequest(
  payload: VerifyEmailPayload,
): Promise<VerifyEmailResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/verify-email`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({ user_id: payload.user_id, otp: payload.otp }),
  });
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/** POST /auth/verify-login — completes login-triggered OTP, issues tokens. */
export async function verifyLoginRequest(
  payload: VerifyLoginPayload,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/verify-login`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({ user_id: payload.user_id, otp: payload.otp }),
  });
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/** POST /auth/verify-2fa — completes 2FA login, issues tokens. */
export async function verify2FARequest(
  payload: Verify2FAPayload,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/verify-2fa`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({ user_id: payload.user_id, code: payload.code }),
  });
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/** GET /auth/invite/validate?token=... — validate invite token before showing form. */
export async function validateInviteRequest(
  token: string,
): Promise<InviteValidateResponse> {
  const res = await fetch(
    `${BASE_URL}/api/v1/auth/invite/validate?token=${encodeURIComponent(token)}`,
    { headers: MOBILE_HEADERS },
  );
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}

/** POST /auth/resend-otp — resend OTP for any pending verification (phone, email, login, 2FA).
 *  Rate-limited. Always returns 204.
 */
export interface ResendOtpPayload {
  user_id: string;
  /** The purpose of the OTP being resent */
  purpose:
    | "phone_verification" // Registration — always phone
    | "email_verification" // Registration — always email
    | "2fa" // Mid-login — uses user's login_channel
    | "password_reset" // Mid-reset — phone or email
    | "login_channel_change"; // Mid-channel-switch — target channel
  /** Optional: target channel for password_reset / login_channel_change */
  channel?: "sms" | "email";
}

/** POST /auth/resend-otp — always 204 on success.
 *  409 CHANNEL_ALREADY_VERIFIED — channel already verified (phone/email flows).
 *  400 OTP_FLOW_NOT_INITIATED — no prior OTP exists for 2fa/password_reset/login_channel_change.
 *  429 — rate limited (3 per 10 min per user_id).
 */
export async function resendOtpRequest(
  payload: ResendOtpPayload,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/resend-otp`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify(payload),
  });
  if (res.status === 409) throw new Error("This channel is already verified.");
  if (res.status === 400)
    throw new Error("No active OTP flow found. Please restart the process.");
  if (res.status === 429) throw new Error(parseError(429));
  if (!res.ok && res.status !== 204) throw new Error(parseError(res.status));
}

/** POST /auth/forgot-password — always 204, rate-limited 3/hour.
 *  Never reveals whether the identifier exists (prevents enumeration).
 *  OTP sent to phone (SMS) or email depending on identifier format.
 */
export async function forgotPasswordRequest(
  payload: ForgotPasswordPayload,
): Promise<ForgotPasswordResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({ identifier: payload.identifier }),
  });
  // 429 = rate limited — the only real error to surface
  if (res.status === 429) throw new Error(parseError(429));
  // 204 = success (no body). Any other non-ok is a server error.
  if (!res.ok && res.status !== 204) throw new Error(parseError(res.status));
  return { sent: true };
}

/** POST /auth/reset-password — OTP-based password reset. Always 204 on success.
 *  All sessions are revoked server-side — client must redirect to login.
 */
export async function resetPasswordRequest(
  payload: ResetPasswordPayload,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({
      otp: payload.otp,
      identifier: payload.identifier,
      new_password: payload.new_password,
    }),
  });
  if (res.status === 400) throw new Error(parseError(400));
  if (res.status === 410) throw new Error(parseError(410));
  if (res.status === 422) throw new Error(parseError(422));
  if (!res.ok && res.status !== 204) throw new Error(parseError(res.status));
  // 204 = success, no body — do not call res.json()
}

/** POST /auth/logout — send refresh token in Authorization header. Always 204. */
export async function logoutRequest(refreshToken: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${refreshToken}` },
  });
  if (res.status !== 204 && !res.ok)
    console.warn("[auth] logout status:", res.status);
}

/** POST /auth/logout-all — send refresh token in Authorization header. Always 204. */
export async function logoutAllRequest(refreshToken: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/logout-all`, {
    method: "POST",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${refreshToken}` },
  });
  if (res.status !== 204 && !res.ok)
    console.warn("[auth] logout-all status:", res.status);
}

/** POST /auth/refresh — refresh token in Authorization header. */
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
      /* empty body */
    }
    if (errorCode === "TOKEN_REUSE_DETECTED") throw new TokenReuseError();
    throw new Error("Session expired. Please sign in again.");
  }

  if (res.status === 403) throw new AccountSuspendedError();
  if (!res.ok) throw new Error(parseError(res.status));
  return res.json();
}
