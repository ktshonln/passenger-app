import {
    resetPasswordRequest
} from "../../services/auth.service";

// ─── Mock global fetch ────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => mockFetch.mockClear());

const VALID_PAYLOAD = { token: "raw-token-abc", new_password: "NewPass1" };

// ─── resetPasswordRequest — real API path ─────────────────────────────────────

describe("resetPasswordRequest — API", () => {
  it("calls POST /api/v1/auth/reset-password with token and new_password", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Password updated. Please log in again." }),
    });

    const result = await resetPasswordRequest(VALID_PAYLOAD);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/v1/auth/reset-password");
    expect(options.method).toBe("POST");
    expect(options.headers["X-Client-Type"]).toBe("mobile");
    const body = JSON.parse(options.body);
    expect(body.token).toBe("raw-token-abc");
    expect(body.new_password).toBe("NewPass1");
    expect(result.message).toBe("Password updated. Please log in again.");
  });

  it("throws INVALID_TOKEN error on 400", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });
    await expect(resetPasswordRequest(VALID_PAYLOAD)).rejects.toThrow(
      "Reset link is invalid or has already been used.",
    );
  });

  it("throws TOKEN_EXPIRED error on 410", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 410 });
    await expect(resetPasswordRequest(VALID_PAYLOAD)).rejects.toThrow(
      "Reset link has expired. Please request a new one.",
    );
  });

  it("throws VALIDATION_ERROR on 422", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 422 });
    await expect(
      resetPasswordRequest({ token: "t", new_password: "weak" }),
    ).rejects.toThrow("Password is too weak");
  });

  it("does NOT return any token in the response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Password updated. Please log in again." }),
    });
    const result = await resetPasswordRequest(VALID_PAYLOAD);
    expect((result as Record<string, unknown>).access_token).toBeUndefined();
    expect((result as Record<string, unknown>).token).toBeUndefined();
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
