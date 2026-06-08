import {
    resetPasswordRequest
} from "../../services/auth.service";

// ─── Mock global fetch ────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => mockFetch.mockClear());

const VALID_PAYLOAD = {
  otp: "123456",
  identifier: "test@example.com",
  new_password: "NewPass1",
};

// ─── resetPasswordRequest — real API path ─────────────────────────────────────

describe("resetPasswordRequest — API", () => {
  it("calls POST /api/v1/auth/reset-password with otp, identifier and new_password", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await resetPasswordRequest(VALID_PAYLOAD);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/auth/reset-password");
    expect(options.method).toBe("POST");
    expect(options.headers["X-Client-Type"]).toBe("mobile");
    const body = JSON.parse(options.body);
    expect(body.otp).toBe("123456");
    expect(body.identifier).toBe("test@example.com");
    expect(body.new_password).toBe("NewPass1");
  });

  it("throws INVALID_TOKEN error on 400", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(resetPasswordRequest(VALID_PAYLOAD)).rejects.toThrow(
      "Request is invalid or has already been used.",
    );
  });

  it("throws TOKEN_EXPIRED error on 410", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 410 });
    await expect(resetPasswordRequest(VALID_PAYLOAD)).rejects.toThrow(
      "OTP has expired. Please request a new one.",
    );
  });

  it("throws VALIDATION_ERROR on 422", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 422 });
    await expect(
      resetPasswordRequest({
        otp: "123456",
        identifier: "test@example.com",
        new_password: "weak",
      }),
    ).rejects.toThrow("Password is too weak");
  });

  it("does NOT return any token in the response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });
    const result = await resetPasswordRequest(VALID_PAYLOAD);
    expect(result).toBeUndefined();
  });
});

// ─── resetPasswordRequest — network failure ───────────────────────────────────

describe("resetPasswordRequest — network failure", () => {
  it("propagates TypeError when network is down", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Network request failed"));
    await expect(resetPasswordRequest(VALID_PAYLOAD)).rejects.toThrow(
      TypeError,
    );
  });
});
