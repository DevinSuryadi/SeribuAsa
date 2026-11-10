import { apiFetch } from "./api";
import type { BackendProfile, ProfileUpdate, UserRole } from "@/types";

export async function getUserProfile(userId: string): Promise<BackendProfile> {
  const response = await apiFetch(`/users/${userId}`);
  return response?.data || response;
}

export async function syncGoogleAuth(fullName?: string): Promise<boolean> {
  try {
    const body = fullName?.trim() ? { full_name: fullName.trim() } : {};
    await apiFetch("/auth/google/sync", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return true;
  } catch {
    return false;
  }
}

export async function createUserProfile(
  userId: string,
  fullName: string,
  role: UserRole
): Promise<boolean> {
  try {
    await apiFetch("/users/signup", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        full_name: fullName,
        role,
      }),
    });
    return true;
  } catch (error: unknown) {
    // 409 means user already exists, which is fine
    return typeof error === "object" && error !== null && "status" in error && error.status === 409;
  }
}

export async function updateUserProfile(
  userId: string,
  profile: ProfileUpdate
): Promise<BackendProfile> {
  const response = await apiFetch(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
  return response?.data || response;
}

export async function ensureUserProfile(
  userId: string,
  fullName: string,
  userRole: UserRole | null
): Promise<boolean> {
  if (userRole === "health_facility") return false;
  // Try sync first
  const synced = await syncGoogleAuth(fullName);
  if (synced) return true;

  // Fallback to signup
  const fallbackRole: UserRole =
    userRole === "beneficiary" || userRole === "vendor" || userRole === "corporate_donor"
      ? userRole
      : "donor";

  return createUserProfile(userId, fullName, fallbackRole);
}
