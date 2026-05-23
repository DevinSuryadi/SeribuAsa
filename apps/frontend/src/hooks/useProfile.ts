import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, ensureUserProfile, updateUserProfile } from "@/services/user";
import { toast } from "sonner";
import type { BackendProfile, UserRole, AsyncState } from "@/types";

interface UseProfileReturn extends AsyncState<BackendProfile> {
  isSubmitting: boolean;
  refetch: () => Promise<void>;
  updateProfile: (profile: {
    full_name: string;
    phone?: string | null;
    address?: string | null;
    date_of_birth?: string | null;
    gender?: "male" | "female" | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
    bank_account_holder?: string | null;
  }) => Promise<boolean>;
}

export function useProfile(): UseProfileReturn {
  const { user, userRole } = useAuth();
  const [data, setData] = useState<BackendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
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
          bank_name: profileData.bank_name || null,
          bank_account_number: profileData.bank_account_number || null,
          bank_account_holder: profileData.bank_account_holder || null,
        };
        setData(profile);
      }
    } catch (err: any) {
      console.warn("[PROFILE] Failed to load profile:", err);
      setError(err.message || "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.fullName, userRole]);

  const updateProfile = useCallback(
    async (profile: {
      full_name: string;
      phone?: string | null;
      address?: string | null;
      date_of_birth?: string | null;
      gender?: "male" | "female" | null;
      bank_name?: string | null;
      bank_account_number?: string | null;
      bank_account_holder?: string | null;
    }): Promise<boolean> => {
      if (!user?.id) {
        toast.error("User tidak ditemukan. Silakan login ulang.");
        return false;
      }

      setIsSubmitting(true);

      try {
        // Try to update directly first
        let updatedProfile = await updateUserProfile(user.id, profile);

        // If 404, ensure profile exists then retry
        if (!updatedProfile) {
          const ensured = await ensureUserProfile(user.id, profile.full_name, userRole);
          if (ensured) {
            updatedProfile = await updateUserProfile(user.id, profile);
          }
        }

        if (updatedProfile) {
          setData({
            full_name: updatedProfile.full_name || profile.full_name,
            role: (updatedProfile.role as UserRole) || userRole,
            phone: updatedProfile.phone || null,
            address: updatedProfile.address || null,
            date_of_birth: updatedProfile.date_of_birth || null,
            gender: updatedProfile.gender || null,
            bank_name: updatedProfile.bank_name || null,
            bank_account_number: updatedProfile.bank_account_number || null,
            bank_account_holder: updatedProfile.bank_account_holder || null,
          });
          toast.success("Profil berhasil diperbarui");
          return true;
        }

        return false;
      } catch (err: any) {
        toast.error("Gagal memperbarui profil", {
          description: err.message || "Terjadi kesalahan",
        });
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.id, userRole]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    data,
    loading,
    error,
    isSubmitting,
    refetch: fetchProfile,
    updateProfile,
  };
}
