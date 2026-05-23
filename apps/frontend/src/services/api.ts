import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LEGACY_API_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (LEGACY_API_URL ? `${String(LEGACY_API_URL).replace(/\/$/, "")}/api/v1` : "http://localhost:8000/api/v1");
let accessTokenCache: string | null = null;
let sessionInitPromise: Promise<void> | null = null;
let isRefreshingToken = false;

// ── Request Deduplication ──────────────────────────────────────
// Track in-flight requests to prevent duplicate simultaneous API calls
// Maps request key (method:endpoint) → pending promise
const inflightRequests = new Map<string, Promise<any>>();

function getRequestKey(endpoint: string, options: RequestInit = {}): string {
  const method = (options.method || "GET").toUpperCase();
  // For GET requests, include query params in key for accurate dedup
  return `${method}:${endpoint}`;
}

type StoredAuthUser = {
  id?: string;
  email?: string;
  role?: string;
};

const isKnownDevRole = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const role = value.trim().toLowerCase();
  return ["donor", "beneficiary", "vendor", "admin", "government", "corporate_donor"].includes(
    role
  );
};

const isAuthLockError = (error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("NavigatorLockAcquireTimeoutError") ||
    msg.includes("Lock broken by another request") ||
    msg.includes("was not released within")
  );
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function initSessionToken() {
  if (sessionInitPromise) {
    await sessionInitPromise;
    return;
  }

  sessionInitPromise = (async () => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        accessTokenCache = session?.access_token ?? null;
        return;
      } catch (error) {
        if (!isAuthLockError(error) || attempt === 3) {
          return;
        }
        await wait(120 * attempt);
      }
    }
  })();

  await sessionInitPromise;
  sessionInitPromise = null;
}

async function refreshSessionToken(): Promise<string | null> {
  if (isRefreshingToken) {
    // Wait for ongoing refresh
    while (isRefreshingToken) {
      await wait(100);
    }
    return accessTokenCache;
  }

  isRefreshingToken = true;
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Failed to refresh session:", error);
      return null;
    }
    accessTokenCache = data.session?.access_token ?? null;
    return accessTokenCache;
  } finally {
    isRefreshingToken = false;
  }
}

supabase.auth.onAuthStateChange((_event, session) => {
  accessTokenCache = session?.access_token ?? null;
});

class ApiError extends Error {
  status: number;
  endpoint: string;
  detail: unknown;

  constructor(message: string, status: number, endpoint: string, detail: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.endpoint = endpoint;
    this.detail = detail;
  }
}

// ── Exponential Backoff Retry Constants ────────────────────────
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 10000; // 10 seconds
const TIMEOUT_RETRY_DELAY = 2000; // Longer delay for timeouts

// Calculate exponential backoff with jitter
function getRetryDelay(retryCount: number, isTimeout: boolean = false): number {
  if (isTimeout) return TIMEOUT_RETRY_DELAY;
  // Exponential: 1s, 2s, 4s with ±20% jitter
  const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
  const jitter = baseDelay * 0.2 * (Math.random() - 0.5);
  return baseDelay + jitter;
}

// Helper to create timeout promise
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  })
    .catch((error) => {
      if (controller.signal.aborted) {
        throw new Error("Request timeout");
      }
      throw error;
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });
}

async function apiFetchWithRetry(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Attach Supabase JWT as Bearer token if available.
  await initSessionToken();
  if (accessTokenCache) {
    headers["Authorization"] = `Bearer ${accessTokenCache}`;
  } else {
    // Attach development identity headers only for demo/local-storage auth.
    let devIdentity: StoredAuthUser = {};
    try {
      const rawStoredAuth = localStorage.getItem("nutriguard-auth");
      if (rawStoredAuth) {
        const storedAuth: StoredAuthUser = JSON.parse(rawStoredAuth);
        devIdentity = {
          id: storedAuth?.id,
          email: storedAuth?.email,
          role: isKnownDevRole(storedAuth?.role)
            ? storedAuth.role.trim().toLowerCase()
            : undefined,
        };
      }
    } catch {
      // Ignore malformed local auth cache.
    }

    if (devIdentity.id) headers["X-Dev-User-Id"] = devIdentity.id;
    if (devIdentity.email) headers["X-Dev-User-Email"] = devIdentity.email;
    if (devIdentity.role) headers["X-Dev-User-Role"] = devIdentity.role;
  }

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    }, REQUEST_TIMEOUT);

    // Handle 401 Unauthorized - Token expired
    if (response.status === 401 && retryCount === 0) {
      console.log(`[API] 401 on ${endpoint}, attempting token refresh...`);

      const newToken = await refreshSessionToken();

      if (newToken) {
        console.log(`[API] Token refreshed, retrying ${endpoint}...`);
        // Retry with new token
        return apiFetchWithRetry(endpoint, options, retryCount + 1);
      } else {
        console.error(`[API] Token refresh failed for ${endpoint}`);
        // Token refresh failed - session expired
        toast.error("Sesi Anda telah berakhir", {
          description: "Silakan login kembali",
        });

        // Clear cache and redirect to login after a short delay
        accessTokenCache = null;
        setTimeout(() => {
          window.location.href = "/login?expired=true";
        }, 2000);

        throw new ApiError("Session expired", 401, endpoint, { message: "Token refresh failed" });
      }
    }

    const responseText = await response.text();
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let payload: unknown = null;
    if (responseText) {
      if (isJson) {
        try {
          payload = JSON.parse(responseText);
        } catch {
          payload = { detail: responseText };
        }
      } else {
        payload = { detail: responseText };
      }
    }

    if (!response.ok) {
      const error = (payload as { detail?: string }) || { detail: "Request failed" };
      const errorMsg = error.detail || `Request failed (${response.status})`;
      console.error(`[API ERROR ${response.status}] ${endpoint}:`, errorMsg, error);
      throw new ApiError(errorMsg, response.status, endpoint, error);
    }

    return payload;
  } catch (error) {
    const isTimeout = error instanceof Error && error.message === "Request timeout";
    const isNetworkError = error instanceof TypeError && error.message.includes("fetch");

    // Retry on timeout or network errors (but not on parse/validation errors)
    if ((isTimeout || isNetworkError) && retryCount < MAX_RETRIES) {
      const delay = getRetryDelay(retryCount, isTimeout);
      console.warn(
        `[API] ${isTimeout ? "Timeout" : "Network error"} on ${endpoint}, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
      );

      await wait(delay);
      return apiFetchWithRetry(endpoint, options, retryCount + 1);
    }

    // Max retries exceeded or non-retryable error
    if (isTimeout || isNetworkError) {
      console.error(`[API] Max retries exceeded for ${endpoint}`);
      const errorMsg = isTimeout
        ? "Koneksi lambat. Server tidak merespons dalam waktu yang ditentukan."
        : "Gagal terhubung ke server. Periksa koneksi internet Anda.";

      toast.error("Kesalahan Jaringan", {
        description: errorMsg,
      });

      throw new ApiError(errorMsg, 0, endpoint, { retryCount: MAX_RETRIES });
    }

    // Re-throw ApiError or other errors
    throw error;
  }
}

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const method = (options.method || "GET").toUpperCase();

  // Only deduplicate idempotent GET requests — mutations (POST/PUT/DELETE)
  // must always go through to avoid silently dropping different payloads.
  if (method === "GET") {
    const requestKey = getRequestKey(endpoint, options);

    // If this GET request is already in-flight, return the existing promise
    if (inflightRequests.has(requestKey)) {
      console.log(`[API] Request dedup: ${requestKey} (reusing in-flight request)`);
      return inflightRequests.get(requestKey)!;
    }

    // Create new request promise
    const promise = apiFetchWithRetry(endpoint, options, 0).finally(() => {
      inflightRequests.delete(requestKey);
    });

    inflightRequests.set(requestKey, promise);
    return promise;
  }

  // Mutations go through directly without dedup
  return apiFetchWithRetry(endpoint, options, 0);
}

export { apiFetch, API_BASE_URL, ApiError };
