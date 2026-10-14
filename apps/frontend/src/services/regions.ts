import { apiFetch } from "./api";

export type Province = { code: string; name: string };
export type Regency = { code: string; province_code: string; name: string };

export const getProvinces = (): Promise<Province[]> => apiFetch("/regions/provinces");
export const getRegencies = (provinceCode: string): Promise<Regency[]> =>
  apiFetch(`/regions/provinces/${encodeURIComponent(provinceCode)}/regencies`);
