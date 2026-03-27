import {
    isStrongPassword,
    isValidIdentifier,
    isValidPhone,
    validateLogin,
    validateOtp,
    validateRegister,
} from "../../utils/validation";

// ─── isValidIdentifier ────────────────────────────────────────────────────────

describe("isValidIdentifier", () => {
  it("accepts a valid email", () =>
    expect(isValidIdentifier("user@example.com")).toBe(true));
  it("accepts a phone number", () =>
    expect(isValidIdentifier("+254712345678")).toBe(true));
  it("rejects a plain string", () =>
    expect(isValidIdentifier("notvalid")).toBe(false));
  it("rejects empty string", () => expect(isValidIdentifier("")).toBe(false));
});

// ─── isValidPhone ─────────────────────────────────────────────────────────────

describe("isValidPhone (E.164)", () => {
  it("accepts +250788000000", () =>
    expect(isValidPhone("+250788000000")).toBe(true));
  it("accepts +254712345678", () =>
    expect(isValidPhone("+254712345678")).toBe(true));
  it("rejects number without +", () =>
    expect(isValidPhone("0712345678")).toBe(false));
  it("rejects too short", () => expect(isValidPhone("+25071")).toBe(false));
});

// ─── isStrongPassword ─────────────────────────────────────────────────────────

describe("isStrongPassword", () => {
  it("accepts pass1234", () => expect(isStrongPassword("pass1234")).toBe(true));
  it("rejects less than 8 chars", () =>
    expect(isStrongPassword("abc123")).toBe(false));
  it("rejects no number", () =>
    expect(isStrongPassword("password")).toBe(false));
  it("rejects no letter", () =>
    expect(isStrongPassword("12345678")).toBe(false));
});

// ─── validateLogin ────────────────────────────────────────────────────────────

describe("validateLogin", () => {
  it("returns errors when fields are empty", () => {
    const e = validateLogin("", "");
    expect(e.identifier).toBeDefined();
    expect(e.password).toBeDefined();
  });

  it("returns identifier error for invalid value", () => {
    const e = validateLogin("notanemail", "password1");
    expect(e.identifier).toBeDefined();
    expect(e.password).toBeUndefined();
  });

  it("returns password error when too short", () => {
    const e = validateLogin("user@example.com", "abc");
    expect(e.password).toBeDefined();
  });

  it("returns no errors for valid input", () => {
    const e = validateLogin("user@example.com", "password1");
    expect(Object.keys(e)).toHaveLength(0);
  });
});

// ─── validateRegister ─────────────────────────────────────────────────────────

describe("validateRegister", () => {
  const valid = {
    first_name: "Jane",
    last_name: "Doe",
    phone_number: "+254700000000",
    password: "pass1234",
  };

  it("returns errors when all fields are empty", () => {
    const e = validateRegister({
      first_name: "",
      last_name: "",
      phone_number: "",
      password: "",
    });
    expect(e.first_name).toBeDefined();
    expect(e.last_name).toBeDefined();
    expect(e.phone_number).toBeDefined();
    expect(e.password).toBeDefined();
  });

  it("rejects phone without + prefix (not E.164)", () => {
    const e = validateRegister({ ...valid, phone_number: "0712345678" });
    expect(e.phone_number).toBeDefined();
  });

  it("rejects weak password (no number)", () => {
    const e = validateRegister({ ...valid, password: "password" });
    expect(e.password).toBeDefined();
  });

  it("rejects weak password (too short)", () => {
    const e = validateRegister({ ...valid, password: "abc123" });
    expect(e.password).toBeDefined();
  });

  it("rejects invalid optional email", () => {
    const e = validateRegister({ ...valid, email: "notanemail" });
    expect(e.email).toBeDefined();
  });

  it("returns no errors for valid input", () => {
    const e = validateRegister(valid);
    expect(Object.keys(e)).toHaveLength(0);
  });

  it("accepts valid optional email", () => {
    const e = validateRegister({ ...valid, email: "jane@example.com" });
    expect(Object.keys(e)).toHaveLength(0);
  });
});

// ─── validateOtp ──────────────────────────────────────────────────────────────

describe("validateOtp", () => {
  it("rejects empty string", () => expect(validateOtp("").otp).toBeDefined());
  it("rejects non-digits", () =>
    expect(validateOtp("abc123").otp).toBeDefined());
  it("rejects 5 digits", () => expect(validateOtp("12345").otp).toBeDefined());
  it("accepts 6 digits", () =>
    expect(validateOtp("123456").otp).toBeUndefined());
});
