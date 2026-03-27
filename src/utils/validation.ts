const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_E164_RE = /^\+[1-9]\d{7,14}$/; // strict E.164: +<country><number>
const PHONE_LOOSE_RE = /^\+?[0-9]{9,15}$/; // loose — for login identifier

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return PHONE_E164_RE.test(value.trim());
}

/** Used for login — accepts email OR any phone-like string */
export function isValidIdentifier(value: string): boolean {
  return EMAIL_RE.test(value.trim()) || PHONE_LOOSE_RE.test(value.trim());
}

/** Min 8 chars, at least 1 letter and 1 number */
export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value);
}

// ─── Login ────────────────────────────────────────────────────────────────────

export function validateLogin(identifier: string, password: string) {
  const errors: { identifier?: string; password?: string } = {};
  if (!identifier.trim()) errors.identifier = "Email or phone is required.";
  else if (!isValidIdentifier(identifier.trim()))
    errors.identifier = "Enter a valid email or phone number.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  return errors;
}

// ─── Register ─────────────────────────────────────────────────────────────────

export interface RegisterFieldErrors {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  password?: string;
  email?: string;
}

export function validateRegister(fields: {
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  email?: string;
}): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  if (!fields.first_name.trim()) errors.first_name = "First name is required.";
  else if (fields.first_name.trim().length > 100)
    errors.first_name = "Max 100 characters.";

  if (!fields.last_name.trim()) errors.last_name = "Last name is required.";
  else if (fields.last_name.trim().length > 100)
    errors.last_name = "Max 100 characters.";

  if (!fields.phone_number.trim())
    errors.phone_number = "Phone number is required.";
  else if (!isValidPhone(fields.phone_number.trim()))
    errors.phone_number =
      "Enter a valid phone in E.164 format (e.g. +250788000000).";

  if (!fields.password) errors.password = "Password is required.";
  else if (!isStrongPassword(fields.password))
    errors.password = "Min 8 characters with at least 1 letter and 1 number.";

  if (fields.email && !isValidEmail(fields.email))
    errors.email = "Enter a valid email address.";

  return errors;
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export function validateOtp(otp: string) {
  const errors: { otp?: string } = {};
  if (!otp.trim()) errors.otp = "OTP is required.";
  else if (!/^\d{6}$/.test(otp.trim()))
    errors.otp = "Enter the 6-digit code from your SMS.";
  return errors;
}
