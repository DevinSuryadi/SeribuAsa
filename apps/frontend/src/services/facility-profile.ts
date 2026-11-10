import { apiFetch } from "./api";
import type { BackendProfile, ProfileUpdate } from "@/types";

interface FacilityProfile {
  full_name: string;
  phone: string | null;
  address: string | null;
  province_code: string | null;
  regency_code: string | null;
  province_name: string | null;
  regency_name: string | null;
}

type FacilityProfileUpdate = Pick<
  ProfileUpdate,
  "full_name" | "phone" | "address" | "province_code" | "regency_code"
>;

function toUserProfile(facility: FacilityProfile): BackendProfile {
  return {
    ...facility,
    role: "health_facility",
    date_of_birth: null,
    gender: null,
  };
}

export async function getFacilityProfile(): Promise<BackendProfile> {
  const facility: FacilityProfile = await apiFetch("/facilities/me", { cache: "no-store" });
  return toUserProfile(facility);
}

export async function updateFacilityProfile(profile: FacilityProfileUpdate): Promise<BackendProfile> {
  const { full_name, phone, address, province_code, regency_code } = profile;
  const facility: FacilityProfile = await apiFetch("/facilities/me", {
    method: "PATCH",
    body: JSON.stringify({ full_name, phone, address, province_code, regency_code }),
  });
  return toUserProfile(facility);
}
