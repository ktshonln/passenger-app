import { getAuthToken } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";

const MOBILE_HEADERS = {
  "Content-Type": "application/json",
  "X-Client-Type": "mobile",
};

// Callback to refresh token (set by auth store)
type RefreshCallback = () => Promise<boolean>;
let refreshCallback: RefreshCallback | null = null;
export function setRefreshCallback(callback: RefreshCallback) {
  refreshCallback = callback;
}
export function clearRefreshCallback() {
  refreshCallback = null;
}

// Wrapper for fetch with automatic token refresh
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function authFetch(
  url: string,
  options: RequestInit = {},
  token?: string,
): Promise<Response> {
  // Set up initial headers
  const headers = new Headers(options.headers || {});
  const finalToken = token ?? getAuthToken();
  if (finalToken) {
    headers.set("Authorization", `Bearer ${finalToken}`);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("X-Client-Type")) {
    headers.set("X-Client-Type", "mobile");
  }

  let response = await fetch(url, { ...options, headers });

  // If we got a 401, try to refresh and retry once
  if (response.status === 401 && refreshCallback) {
    // Ensure only one refresh happens at a time
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshCallback();
    }

    const refreshSuccess = await refreshPromise;
    isRefreshing = false;

    if (refreshSuccess) {
      // Refresh succeeded, get the new token and retry the request
      const newToken = getAuthToken();
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(url, { ...options, headers });
      }
    }
  }

  return response;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  user_type: "passenger" | "staff";
  avatar_path: string | null;
  org_id: string | null;
  roles: string[];
  status: "active" | "pending_verification" | "suspended";
  two_factor_enabled: boolean;
  login_channel: "phone" | "email" | null;
  locale: "rw" | "en" | "fr";
  phone_number?: string;
  email?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

// Backward compatibility type for existing code that expects tokens object
export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  user_type: "passenger" | "staff";
  device_name: string;
}

// New types for 202 responses
export interface LoginRequiresVerificationResponse {
  requires_verification: true;
  user_id: string;
  channel: "phone" | "email";
  expires_in: number;
}

export interface LoginRequires2FAResponse {
  requires_2fa: true;
  user_id: string;
  expires_in: number;
}

export type LoginResult =
  | AuthResponse
  | LoginRequiresVerificationResponse
  | LoginRequires2FAResponse;

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
  channel: "phone" | "email";
  device_name?: string;
}

export interface Verify2FAPayload {
  user_id: string;
  otp: string;
  device_name?: string;
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
  token_type: string;
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

export class ApiError extends Error {
  public code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

// ─── Error parser ─────────────────────────────────────────────────────────────

export async function parseErrorResponse(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    if (body.error?.code) {
      return new ApiError(
        body.error.code,
        body.error.message || "Something went wrong",
      );
    }
  } catch {
    // If we can't parse JSON, fall through to status code messages
  }

  // Fallback to status code based messages
  let code = "UNKNOWN_ERROR";
  let message = "Something went wrong. Please try again.";
  if (res.status === 400) {
    code = "BAD_REQUEST";
    message = "Request is invalid or has already been used.";
  }
  if (res.status === 401) {
    code = "UNAUTHORIZED";
    message = "Invalid credentials. Please try again.";
  }
  if (res.status === 403) {
    code = "FORBIDDEN";
    message = "Your account has been suspended. Please contact support.";
  }
  if (res.status === 409) {
    code = "CONFLICT";
    message = "An account with this phone/email already exists.";
  }
  if (res.status === 410) {
    code = "GONE";
    message = "OTP has expired. Please request a new one.";
  }
  if (res.status === 422) {
    code = "UNPROCESSABLE_ENTITY";
    message =
      "Password is too weak. Use at least 8 characters with a letter and number.";
  }
  if (res.status === 429) {
    code = "TOO_MANY_REQUESTS";
    message = "Too many attempts. Please wait a while and try again.";
  }
  if (res.status >= 500) {
    code = "SERVER_ERROR";
    message = "Server error. Please try again later.";
  }

  return new ApiError(code, message);
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export async function loginRequest(
  payload: LoginPayload,
): Promise<LoginResult> {
  console.log("[loginRequest] Starting request to", `${API_BASE_URL}/auth/login`);
  console.log("[loginRequest] Payload:", JSON.stringify(payload, null, 2));
  
  // Create a timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: MOBILE_HEADERS,
      body: JSON.stringify({
        identifier: payload.identifier,
        password: payload.password,
        user_type: payload.user_type,
        device_name: payload.device_name,
      }),
      signal: controller.signal,
    });

    console.log("[loginRequest] Response status:", res.status);

    if (!res.ok && res.status !== 202) {
      throw await parseErrorResponse(res);
    }

    const result = await res.json();
    console.log("[loginRequest] Response body:", JSON.stringify(result, null, 2));
    return result;
  } catch (e) {
    console.error("[loginRequest] Error:", e);
    if (e instanceof Error && e.name === "AbortError") {
      throw new ApiError("TIMEOUT", "Request timed out. Please try again.");
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function registerRequest(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
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
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/** POST /auth/verify-phone — standalone phone verification, NO tokens issued.
 *  On success: activates account, returns login_identifier for pre-filling login.
 *  Direct user to /auth/login with login_identifier pre-filled.
 */
export async function verifyPhoneRequest(
  payload: VerifyPhonePayload,
): Promise<VerifyPhoneResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/verify-phone`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({ user_id: payload.user_id, otp: payload.otp }),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/** POST /auth/register-device — register FCM token for push notifications.
 *  Call after login. Switches notif_channel to ["app"] automatically.
 */
export async function registerDeviceRequest(
  payload: RegisterDevicePayload,
  accessToken: string,
): Promise<RegisterDeviceResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register-device`, {
    method: "POST",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/** POST /auth/verify-email — standalone email verification, no tokens. */
export async function verifyEmailRequest(
  payload: VerifyEmailPayload,
): Promise<VerifyEmailResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({ user_id: payload.user_id, otp: payload.otp }),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/** POST /auth/verify-login — completes login-triggered OTP, issues tokens. */
export async function verifyLoginRequest(
  payload: VerifyLoginPayload,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/verify-login`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({
      user_id: payload.user_id,
      otp: payload.otp,
      channel: payload.channel,
      ...(payload.device_name ? { device_name: payload.device_name } : {}),
    }),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/** POST /auth/verify-2fa — completes 2FA login, issues tokens. */
export async function verify2FARequest(
  payload: Verify2FAPayload,
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({
      user_id: payload.user_id,
      otp: payload.otp,
      ...(payload.device_name ? { device_name: payload.device_name } : {}),
    }),
  });
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/** GET /auth/invite/validate?token=... — validate invite token before showing form. */
export async function validateInviteRequest(
  token: string,
): Promise<InviteValidateResponse> {
  const res = await fetch(
    `${API_BASE_URL}/auth/invite/validate?token=${encodeURIComponent(token)}`,
    { headers: MOBILE_HEADERS },
  );
  if (!res.ok) throw await parseErrorResponse(res);
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
    | "login_channel_change" // Mid-channel-switch — target channel
    | "login_verification"; // Mid-login — account pending verification
  /** Optional: target channel for password_reset / login_channel_change / login_verification */
  channel?: "phone" | "email";
}

/** POST /auth/resend-otp — always 204 on success.
 *  409 CHANNEL_ALREADY_VERIFIED — channel already verified (phone/email flows).
 *  400 OTP_FLOW_NOT_INITIATED — no prior OTP exists for 2fa/password_reset/login_channel_change.
 *  429 — rate limited (3 per 10 min per user_id).
 */
export async function resendOtpRequest(
  payload: ResendOtpPayload,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify(payload),
  });
  if (res.status === 409)
    throw new ApiError(
      "CHANNEL_ALREADY_VERIFIED",
      "This channel is already verified.",
    );
  if (res.status === 400)
    throw new ApiError(
      "OTP_FLOW_NOT_INITIATED",
      "No active OTP flow found. Please restart the process.",
    );
  if (res.status === 429) {
    throw await parseErrorResponse(res);
  }
  if (!res.ok && res.status !== 204) throw await parseErrorResponse(res);
}

/** POST /auth/forgot-password — always 204, rate-limited 3/hour.
 *  Never reveals whether the identifier exists (prevents enumeration).
 *  OTP sent to phone (SMS) or email depending on identifier format.
 */
export async function forgotPasswordRequest(
  payload: ForgotPasswordPayload,
): Promise<ForgotPasswordResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({ identifier: payload.identifier }),
  });
  // 429 = rate limited — the only real error to surface
  if (res.status === 429) {
    const dummyRes = new Response(null, { status: 429 });
    throw await parseErrorResponse(dummyRes);
  }
  // 204 = success (no body). Any other non-ok is a server error.
  if (!res.ok && res.status !== 204) throw await parseErrorResponse(res);
  return { sent: true };
}

/** POST /auth/reset-password — OTP-based password reset. Always 204 on success.
 *  All sessions are revoked server-side — client must redirect to login.
 */
export async function resetPasswordRequest(
  payload: ResetPasswordPayload,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: MOBILE_HEADERS,
    body: JSON.stringify({
      otp: payload.otp,
      identifier: payload.identifier,
      new_password: payload.new_password,
    }),
  });
  if (res.status === 400) {
    const dummyRes = new Response(null, { status: 400 });
    throw await parseErrorResponse(dummyRes);
  }
  if (res.status === 410) {
    const dummyRes = new Response(null, { status: 410 });
    throw await parseErrorResponse(dummyRes);
  }
  if (res.status === 422) throw await parseErrorResponse(res);
  if (!res.ok && res.status !== 204) throw await parseErrorResponse(res);
  // 204 = success, no body — do not call res.json()
}

/** POST /auth/logout — send refresh token in Authorization header. Always 204. */
export async function logoutRequest(refreshToken: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${refreshToken}` },
  });
  if (res.status !== 204 && !res.ok)
    console.warn("[auth] logout status:", res.status);
}

/** POST /auth/logout-all — send refresh token in Authorization header. Always 204. */
export async function logoutAllRequest(refreshToken: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/auth/logout-all`, {
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
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
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
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}
