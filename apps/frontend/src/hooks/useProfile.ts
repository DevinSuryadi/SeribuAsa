import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, ensureUserProfile, updateUserProfile } from "@/services/user";
import { getFacilityProfile, updateFacilityProfile } from "@/services/facility-profile";
import { toast } from "sonner";
import type { BackendProfile, ProfileUpdate, UserRole, AsyncState } from "@/types";
import useSWR from "swr";

interface UseProfileReturn extends AsyncState<BackendProfile> {
  isSubmitting: boolean;
  refetch: () => Promise<void>;
  updateProfile: (profile: ProfileUpdate) => Promise<boolean>;
}

export function useProfile(): UseProfileReturn {
  const { user, userRole } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetcher = async () => {
    if (!user?.id) throw new Error("No user ID");
    
    if (userRole === "health_facility") return getFacilityProfile();

    let profileData = await getUserProfile(user.id);

    // If profile not found, try to create/sync it
    if (!profileData) {
      const ensured = await ensureUserProfile(user.id, user.fullName || "Pengguna", userRole);
      if (ensured) {
        profileData = await getUserProfile(user.id);
      }
    }

    if (profileData) {
      const profile: BackendProfile = {
        full_name: profileData.full_name || user.fullName || "Pengguna",
        role: (profileData.role as UserRole) || null,
        phone: profileData.phone || null,
        address: profileData.address || null,
        date_of_birth: profileData.date_of_birth || null,
        gender: profileData.gender || null,
        store_name: profileData.store_name || null,
        store_address: profileData.store_address || null,
        store_image_url: profileData.store_image_url || null,
        operating_hours: profileData.operating_hours || null,
        rating: profileData.rating || null,
        total_transactions: profileData.total_transactions || null,
        bank_name: profileData.bank_name || null,
        bank_account_number: profileData.bank_account_number || null,
        bank_account_holder: profileData.bank_account_holder || null,
        province_code: profileData.province_code || null,
        regency_code: profileData.regency_code || null,
        province_name: profileData.province_name || null,
        regency_name: profileData.regency_name || null,
      };
      return profile;
    }
    return null;
  };

  const { data, error, isLoading, mutate } = useSWR<BackendProfile | null>(
    user?.id && userRole ? ["profile", user.id, userRole] : null,
    fetcher,
    { shouldRetryOnError: false }
  );

  const updateProfile = useCallback(
    async (profile: ProfileUpdate): Promise<boolean> => {
      if (!user?.id) {
        toast.error("User tidak ditemukan. Silakan login ulang.");
        return false;
      }

      setIsSubmitting(true);

      try {
        // Try to update directly first
        let updatedProfile = userRole === "health_facility"
          ? await updateFacilityProfile(profile)
          : await updateUserProfile(user.id, profile);

        // If 404, ensure profile exists then retry
        if (!updatedProfile && userRole !== "health_facility") {
          const ensured = await ensureUserProfile(user.id, profile.full_name, userRole);
          if (ensured) {
            updatedProfile = await updateUserProfile(user.id, profile);
          }
        }

        if (updatedProfile) {
          const newProfile = {
            full_name: updatedProfile.full_name || profile.full_name,
            role: (updatedProfile.role as UserRole) || userRole,
            phone: updatedProfile.phone || null,
            address: updatedProfile.address || null,
            date_of_birth: updatedProfile.date_of_birth || null,
            gender: updatedProfile.gender || null,
            store_name: updatedProfile.store_name || profile.store_name || null,
            store_address: updatedProfile.store_address || profile.store_address || null,
            store_image_url: updatedProfile.store_image_url || profile.store_image_url || null,
            operating_hours: updatedProfile.operating_hours || profile.operating_hours || null,
            rating: updatedProfile.rating || null,
            total_transactions: updatedProfile.total_transactions || null,
            bank_name: updatedProfile.bank_name || profile.bank_name || null,
            bank_account_number: updatedProfile.bank_account_number || profile.bank_account_number || null,
            bank_account_holder: updatedProfile.bank_account_holder || profile.bank_account_holder || null,
            province_code: updatedProfile.province_code ?? null,
            regency_code: updatedProfile.regency_code ?? null,
            province_name: updatedProfile.province_name ?? null,
            regency_name: updatedProfile.regency_name ?? null,
          };
          
          mutate(newProfile, false); // Update local cache without re-fetching
          toast.success("Profil berhasil diperbarui");
          return true;
        }

        return false;
      } catch (err: unknown) {
        toast.error("Gagal memperbarui profil", {
          description: err instanceof Error ? err.message : "Terjadi kesalahan",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.id, userRole, mutate]
  );

  return {
    data: data || null,
    loading: isLoading || Boolean(user?.id && !userRole),
    error: error ? (error.message || "Gagal memuat profil") : null,
    isSubmitting,
    refetch: async () => { await mutate(); },
    updateProfile,
  };
}
