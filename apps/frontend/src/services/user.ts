import { apiFetch } from "./api";
import type { BackendProfile, UserRole } from "@/types";

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
  } catch (error: any) {
    // 409 means user already exists, which is fine
    return error?.status === 409;
  }
}

export async function updateUserProfile(
  userId: string,
  profile: {
    full_name: string;
    phone?: string | null;
    address?: string | null;
    date_of_birth?: string | null;
    gender?: "male" | "female" | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
    bank_account_holder?: string | null;
  }
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
