import { supabase } from "@/integrations/supabase/client"

const API_BASE_URL = "http://localhost:8000/api/v1"

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  // Attach Supabase JWT as Bearer token if available
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(error.detail || "Request failed")
  }

  return response.json()
}

export { apiFetch, API_BASE_URL }
