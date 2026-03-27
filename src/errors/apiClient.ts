import { AppError } from "./AppError";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.katisha.app";

// ─── Audit log (fire-and-forget) ──────────────────────────────────────────────

function auditError(
  status: number,
  path: string,
  meta?: Record<string, unknown>,
) {
  const entry = {
    action: "API_ERROR",
    resource: path,
    meta: { status, ...meta },
    timestamp: new Date().toISOString(),
  };
  fetch(`${BASE_URL}/api/v1/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  }).catch(() => {
    if (__DEV__) console.warn("[AUDIT_ERROR]", JSON.stringify(entry));
  });
}

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

export interface FetchOptions extends RequestInit {
  /** Skip audit logging for this request (e.g. the audit endpoint itself). */
  skipAudit?: boolean;
}

/**
 * Typed fetch wrapper.
 * - Maps 403 → AppError("FORBIDDEN")
 * - Maps 404 → AppError("NOT_FOUND")
 * - Maps 5xx → AppError("SERVER_ERROR")
 * - Network failure → AppError("NETWORK_ERROR")
 * - Logs 403 and 5xx to audit_logs via fire-and-forget
 */
export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAudit = false, ...fetchOptions } = options;
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  try {
    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const err = AppError.fromStatus(res.status);

      // Log 403 and 5xx to audit table per spec
      if (!skipAudit && (res.status === 403 || res.status >= 500)) {
        auditError(res.status, path, {
          method: fetchOptions.method ?? "GET",
        });
      }

      throw err;
    }

    // 204 No Content — return empty object
    if (res.status === 204) return {} as T;

    return res.json() as Promise<T>;
  } catch (e) {
    if (e instanceof AppError) throw e;
    // TypeError = network failure (offline, DNS, etc.)
    if (e instanceof TypeError) throw AppError.network();
    throw e;
  }
}

// ─── Health check ─────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    await apiFetch("/health", { skipAudit: true });
    return true;
  } catch {
    return false;
  }
}
