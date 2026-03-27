// ─── Error codes ──────────────────────────────────────────────────────────────

export type ErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

// ─── Typed application error ──────────────────────────────────────────────────

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(message: string, code: ErrorCode, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }

  static fromStatus(status: number, fallbackMessage?: string): AppError {
    if (status === 403)
      return new AppError(
        "You don't have permission to perform this action.",
        "FORBIDDEN",
        403,
      );
    if (status === 404)
      return new AppError(
        "The resource you're looking for doesn't exist.",
        "NOT_FOUND",
        404,
      );
    if (status >= 500)
      return new AppError(
        fallbackMessage ?? "Something went wrong on our end. Please try again.",
        "SERVER_ERROR",
        status,
      );
    return new AppError(
      fallbackMessage ?? "An unexpected error occurred.",
      "UNKNOWN",
      status,
    );
  }

  static network(): AppError {
    return new AppError(
      "No internet connection. Please check your network.",
      "NETWORK_ERROR",
      0,
    );
  }

  get isNotFound() {
    return this.code === "NOT_FOUND";
  }
  get isForbidden() {
    return this.code === "FORBIDDEN";
  }
  get isServerError() {
    return this.code === "SERVER_ERROR";
  }
  get isNetworkError() {
    return this.code === "NETWORK_ERROR";
  }
}
