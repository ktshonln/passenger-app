import {
    loginRequest,
    registerRequest,
    verifyPhoneRequest,
} from "../../services/auth.service";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => mockFetch.mockClear());

const MOCK_USER = {
  id: "u1",
  first_name: "Jane",
  last_name: "Doe",
  phone_number: "+254700000000",
  email: "jane@example.com",
};

const MOCK_AUTH_RESPONSE = {
  access_token: "jwt-access",
  refresh_token: "jwt-refresh",
  user: MOCK_USER,
};

const MOCK_REGISTER_RESPONSE = {
  message: "OTP sent to +254700***000. Please verify your phone.",
  user_id: "u1",
  otp_expires_in: 300,
};

// ─── loginRequest ─────────────────────────────────────────────────────────────

describe("loginRequest", () => {
  it("calls POST /api/v1/auth/login with correct body and X-Client-Type header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_AUTH_RESPONSE,
    });

    const result = await loginRequest({
      identifier: "jane@example.com",
      password: "pass1234",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/auth/login");
    expect(options.method).toBe("POST");
    expect(options.headers["X-Client-Type"]).toBe("mobile");
    expect(JSON.parse(options.body)).toMatchObject({
      identifier: "jane@example.com",
    });
    expect(result.access_token).toBe("jwt-access");
  });

  it("throws user-friendly error on 401", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(
      loginRequest({ identifier: "x", password: "y" }),
    ).rejects.toThrow("Invalid credentials. Please try again.");
  });

  it("throws user-friendly error on 500", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(
      loginRequest({ identifier: "x", password: "y" }),
    ).rejects.toThrow("Server error. Please try again later.");
  });
});

// ─── registerRequest ──────────────────────────────────────────────────────────

describe("registerRequest", () => {
  it("calls POST /api/v1/auth/register with correct fields", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_REGISTER_RESPONSE,
    });

    const result = await registerRequest({
      first_name: "Jane",
      last_name: "Doe",
      phone_number: "+254700000000",
      password: "pass1234",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/auth/register");
    expect(options.headers["X-Client-Type"]).toBe("mobile");
    const body = JSON.parse(options.body);
    expect(body.first_name).toBe("Jane");
    expect(body.last_name).toBe("Doe");
    expect(body.phone_number).toBe("+254700000000");
    expect(result.user_id).toBe("u1");
    expect(result.otp_expires_in).toBe(300);
  });

  it("does NOT return a token (OTP step required)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_REGISTER_RESPONSE,
    });
    const result = await registerRequest({
      first_name: "Jane",
      last_name: "Doe",
      phone_number: "+254700000000",
      password: "pass1234",
    });
    expect((result as Record<string, unknown>).access_token).toBeUndefined();
  });

  it("throws conflict error on 409", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 409 });
    await expect(
      registerRequest({
        first_name: "Jane",
        last_name: "Doe",
        phone_number: "+254700000000",
        password: "pass1234",
      }),
    ).rejects.toThrow("An account with this phone/email already exists.");
  });
});

// ─── verifyPhoneRequest ───────────────────────────────────────────────────────

describe("verifyPhoneRequest", () => {
  it("calls POST /api/v1/auth/verify-phone with user_id and otp", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_AUTH_RESPONSE,
    });

    const result = await verifyPhoneRequest({ user_id: "u1", otp: "123456" });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/auth/verify-phone");
    expect(options.headers["X-Client-Type"]).toBe("mobile");
    const body = JSON.parse(options.body);
    expect(body.user_id).toBe("u1");
    expect(body.otp).toBe("123456");
    expect(result.access_token).toBe("jwt-access");
    expect(result.user.first_name).toBe("Jane");
  });

  it("throws on invalid OTP (401)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(
      verifyPhoneRequest({ user_id: "u1", otp: "000000" }),
    ).rejects.toThrow("Invalid credentials. Please try again.");
  });
});
