import { AppError } from "../../errors/AppError";

describe("AppError.fromStatus", () => {
  it("maps 403 to FORBIDDEN", () => {
    const e = AppError.fromStatus(403);
    expect(e.code).toBe("FORBIDDEN");
    expect(e.statusCode).toBe(403);
    expect(e.isForbidden).toBe(true);
    expect(e).toBeInstanceOf(AppError);
  });

  it("maps 404 to NOT_FOUND", () => {
    const e = AppError.fromStatus(404);
    expect(e.code).toBe("NOT_FOUND");
    expect(e.isNotFound).toBe(true);
  });

  it("maps 500 to SERVER_ERROR", () => {
    const e = AppError.fromStatus(500);
    expect(e.code).toBe("SERVER_ERROR");
    expect(e.isServerError).toBe(true);
  });

  it("maps 503 to SERVER_ERROR", () => {
    const e = AppError.fromStatus(503);
    expect(e.code).toBe("SERVER_ERROR");
    expect(e.statusCode).toBe(503);
  });

  it("maps unknown status to UNKNOWN", () => {
    const e = AppError.fromStatus(418);
    expect(e.code).toBe("UNKNOWN");
  });

  it("uses fallback message when provided", () => {
    const e = AppError.fromStatus(500, "Custom error");
    expect(e.message).toBe("Custom error");
  });
});

describe("AppError.network", () => {
  it("creates NETWORK_ERROR", () => {
    const e = AppError.network();
    expect(e.code).toBe("NETWORK_ERROR");
    expect(e.statusCode).toBe(0);
    expect(e.isNetworkError).toBe(true);
  });
});

describe("AppError boolean helpers", () => {
  it("only one flag is true per instance", () => {
    const e = AppError.fromStatus(403);
    expect(e.isForbidden).toBe(true);
    expect(e.isNotFound).toBe(false);
    expect(e.isServerError).toBe(false);
    expect(e.isNetworkError).toBe(false);
  });
});
