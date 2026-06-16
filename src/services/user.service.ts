import { parseErrorResponse, MOBILE_HEADERS, authFetch } from "./auth.service";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.katisha.online/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserMePassenger {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  phone_verified_at: string | null;
  email: string | null;
  email_verified_at: string | null;
  avatar_path: string | null;
  user_type: "passenger";
  status: "active" | "pending_verification" | "suspended";
  login_channel: "phone" | "email" | null;
  notif_channel: ("sms" | "email" | "app")[];
  locale: "rw" | "en" | "fr";
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  avatar_path?: string | null;
  notif_channel?: ("sms" | "email" | "app")[];
  locale?: "rw" | "en" | "fr";
  two_factor_enabled?: boolean;
}

export interface ValidatePasswordPayload {
  password: string;
  action: "change_password" | "delete_account" | "purchase_ticket";
}

export interface ValidatePasswordResponse {
  sudoToken: string;
  expiresAt: string;
  expiresIn: number;
}

export interface AvatarPresignedUrlResponse {
  upload_url: string;
  path: string;
}

export interface LoginChannelChangeRequest {
  channel: "phone" | "email";
  identifier?: string;
}

export interface LoginChannelChangeResponse {
  expires_in: number;
  masked_identifier: string;
}

export interface LoginChannelConfirmPayload {
  channel: "phone" | "email";
  otp: string;
}

export interface LoginChannelConfirmResponse {
  login_channel: "phone" | "email";
}

export interface UserDevice {
  id: string;
  device_name: string | null;
  fcm_token_preview: string;
  registered_at: string;
  last_active_at: string | null;
}

export interface UserDevicesResponse {
  data: UserDevice[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function fetchProfile(token: string): Promise<UserMePassenger> {
  const res = await fetch(`${BASE_URL}/users/me`, {
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function updateProfile(
  token: string,
  payload: UpdateProfilePayload,
): Promise<UserMePassenger> {
  const res = await fetch(`${BASE_URL}/users/me`, {
    method: "PATCH",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function validatePassword(
  token: string,
  payload: ValidatePasswordPayload,
): Promise<ValidatePasswordResponse> {
  if (process.env.NODE_ENV !== "test") {
    console.log("[validatePassword] URL:", `${BASE_URL}/users/me/validate-password`);
    console.log("[validatePassword] Request payload:", payload);
    console.log("[validatePassword] Token length:", token.length);
  }
  
  const res = await authFetch(
    `${BASE_URL}/users/me/validate-password`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
  
  if (process.env.NODE_ENV !== "test") {
    console.log("[validatePassword] Response status:", res.status, res.statusText);
  }
  
  if (!res.ok) {
    const err = await parseErrorResponse(res);
    if (process.env.NODE_ENV !== "test") {
      console.error("[validatePassword] Error:", err);
    }
    throw err;
  }
  
  const result = await res.json();
  if (process.env.NODE_ENV !== "test") {
    console.log("[validatePassword] Success response:", result);
  }
  return result;
}

export async function changePassword(
  token: string,
  newPassword: string,
  sudoToken: string,
): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(`${BASE_URL}/users/me`, {
    method: "PATCH",
    headers: {
      ...MOBILE_HEADERS,
      Authorization: `Bearer ${token}`,
      "x-sudo-token": sudoToken,
    },
    body: JSON.stringify({ password: newPassword }),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function deleteAccount(
  token: string,
  sudoToken: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/me`, {
    method: "DELETE",
    headers: {
      ...MOBILE_HEADERS,
      Authorization: `Bearer ${token}`,
      "x-sudo-token": sudoToken,
    },
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
}

export async function getAvatarPresignedUrl(
  token: string,
  contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
): Promise<AvatarPresignedUrlResponse> {
  const res = await fetch(
    `${BASE_URL}/users/me/avatar/presigned-url?content_type=${encodeURIComponent(contentType)}`,
    {
      headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function initiateLoginChannelChange(
  token: string,
  payload: LoginChannelChangeRequest,
): Promise<LoginChannelChangeResponse> {
  const res = await fetch(`${BASE_URL}/users/me/login-channel`, {
    method: "POST",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function confirmLoginChannelChange(
  token: string,
  payload: LoginChannelConfirmPayload,
): Promise<LoginChannelConfirmResponse> {
  const res = await fetch(`${BASE_URL}/users/me/login-channel/confirm`, {
    method: "POST",
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}

export async function fetchDevices(token: string): Promise<UserDevicesResponse> {
  const res = await fetch(`${BASE_URL}/users/me/devices`, {
    headers: { ...MOBILE_HEADERS, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  return res.json();
}