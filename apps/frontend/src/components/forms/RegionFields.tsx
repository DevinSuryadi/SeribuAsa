import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getProvinces, getRegencies, type Province, type Regency } from "@/services/regions";

interface RegionFieldsProps {
  idPrefix: string;
  provinceCode: string;
  regencyCode: string;
  onChange: (provinceCode: string, regencyCode: string) => void;
  disabled?: boolean;
  required?: boolean;
  registration?: boolean;
  accent?: "emerald" | "purple";
}

export default function RegionFields({
  idPrefix, provinceCode, regencyCode, onChange, disabled = false,
  required = false, registration = false, accent = "emerald",
}: RegionFieldsProps) {
  const [retryKey, setRetryKey] = useState(0);
  const regionKey = `${provinceCode}:${retryKey}`;
  const [data, setData] = useState<{
    key: string; provinces: Province[]; regencies: Regency[]; error: string;
  } | null>(null);
  const loading = data?.key !== regionKey;
  const provinces = data?.provinces ?? [];
  const regencies = loading ? [] : data?.regencies ?? [];
  const error = loading ? "" : data?.error ?? "";

  useEffect(() => {
    let active = true;
    Promise.all([getProvinces(), provinceCode ? getRegencies(provinceCode) : Promise.resolve([])])
      .then(([provinceRows, regencyRows]) => {
        if (active) setData({ key: regionKey, provinces: provinceRows, regencies: regencyRows, error: "" });
      })
      .catch(() => {
        if (active) setData((previous) => ({ key: regionKey, provinces: previous?.provinces ?? [], regencies: [], error: "Daftar wilayah gagal dimuat." }));
      });
    return () => { active = false; };
  }, [provinceCode, regionKey]);

  const labelClass = registration
    ? "mb-1 block text-xs font-semibold text-[#333]"
    : "mb-1 block text-xs font-bold uppercase tracking-wide";
  const inputClass = registration
    ? "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
    : `w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:ring-2 ${accent === "purple" ? "focus:border-purple-400 focus:ring-purple-100" : "focus:border-emerald-400 focus:ring-emerald-100"}`;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={`${idPrefix}-province`} className={labelClass}>Provinsi</label>
        <select id={`${idPrefix}-province`} className={inputClass} required={required} value={provinceCode} disabled={disabled || loading} onChange={(event) => onChange(event.target.value, "")}>
          <option value="">Pilih provinsi</option>
          {provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-regency`} className={labelClass}>Kota/kabupaten</label>
        <select id={`${idPrefix}-regency`} className={inputClass} required={required} value={regencyCode} disabled={disabled || loading || !provinceCode || !regencies.length} onChange={(event) => onChange(provinceCode, event.target.value)}>
          <option value="">Pilih kota/kabupaten</option>
          {regencies.map((regency) => <option key={regency.code} value={regency.code}>{regency.name}</option>)}
        </select>
      </div>
      {error && <div role="alert" className="flex items-center gap-3 text-sm text-destructive sm:col-span-2">
        <span>{error}</span>
        <Button type="button" size="sm" variant="outline" onClick={() => setRetryKey((key) => key + 1)}>Coba lagi</Button>
      </div>}
    </div>
  );
}
