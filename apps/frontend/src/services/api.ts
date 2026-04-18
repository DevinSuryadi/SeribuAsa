import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
let accessTokenCache: string | null = null;
let sessionInitPromise: Promise<void> | null = null;

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

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Attach Supabase JWT as Bearer token if available.
  // Uses cache to avoid auth lock contention during concurrent requests.
  await initSessionToken();
  if (accessTokenCache) {
    headers["Authorization"] = `Bearer ${accessTokenCache}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const responseText = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let payload: any = null;
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
    const error = payload || { detail: "Request failed" };
    const errorMsg = error.detail || `Request failed (${response.status})`;
    console.error(`[API ERROR ${response.status}] ${endpoint}:`, errorMsg, error);
    throw new ApiError(errorMsg, response.status, endpoint, error);
  }

  return payload;
}

export { apiFetch, API_BASE_URL, ApiError };
