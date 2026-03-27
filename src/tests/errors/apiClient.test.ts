import { apiFetch, checkHealth } from "../../errors/apiClient";
import { AppError } from "../../errors/AppError";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => mockFetch.mockClear());

// ─── apiFetch ─────────────────────────────────────────────────────────────────

describe("apiFetch", () => {
  it("returns parsed JSON on 200", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "1" }),
    });
    const result = await apiFetch<{ id: string }>("/api/v1/test");
    expect(result.id).toBe("1");
  });

  it("returns empty object on 204", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
    const result = await apiFetch("/api/v1/test");
    expect(result).toEqual({});
  });

  it("throws AppError FORBIDDEN on 403", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 403 })
      .mockResolvedValueOnce({ ok: true, status: 204 }); // audit log
    const err = await apiFetch("/api/v1/restricted").catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("throws AppError NOT_FOUND on 404", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const err = await apiFetch("/api/v1/missing").catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("throws AppError SERVER_ERROR on 500", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 204 }); // audit
    const err = await apiFetch("/api/v1/broken").catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("SERVER_ERROR");
  });

  it("throws AppError NETWORK_ERROR on TypeError", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Network request failed"));
    const err = await apiFetch("/api/v1/test").catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe("NETWORK_ERROR");
  });

  it("fires audit log for 403 errors", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 403 })
      .mockResolvedValueOnce({ ok: true, status: 204 });
    await apiFetch("/api/v1/restricted").catch(() => {});
    // Second call should be the audit log
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [auditUrl, auditOptions] = mockFetch.mock.calls[1];
    expect(auditUrl).toContain("/api/v1/audit");
    const body = JSON.parse(auditOptions.body);
    expect(body.action).toBe("API_ERROR");
    expect(body.meta.status).toBe(403);
  });

  it("fires audit log for 500 errors", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 204 });
    await apiFetch("/api/v1/broken").catch(() => {});
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.meta.status).toBe(500);
  });

  it("does NOT fire audit log for 404 errors", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await apiFetch("/api/v1/missing").catch(() => {});
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("skips audit log when skipAudit is true", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await apiFetch("/api/v1/broken", { skipAudit: true }).catch(() => {});
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ─── checkHealth ──────────────────────────────────────────────────────────────

describe("checkHealth", () => {
  it("returns true when server responds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    expect(await checkHealth()).toBe(true);
  });

  it("returns false when server is down", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Network request failed"));
    expect(await checkHealth()).toBe(false);
  });

  it("returns false on 500", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    expect(await checkHealth()).toBe(false);
  });
});
