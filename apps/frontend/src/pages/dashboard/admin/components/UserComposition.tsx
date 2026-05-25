import { useMemo } from "react";
import { PieChart } from "lucide-react";
import type { AdminStats } from "../types";

interface UserCompositionProps {
  stats: AdminStats;
}

export function UserComposition({ stats }: UserCompositionProps) {
  const donors = stats?.users?.donors || 0;
  const beneficiaries = stats?.users?.beneficiaries || 0;
  const vendors = stats?.users?.vendors || 0;
  const totalComposition = donors + beneficiaries + vendors;

  const pieGradient = useMemo(() => {
    if (totalComposition === 0) {
      return "conic-gradient(#e2e8f0 0deg 360deg)";
    }

    const donorDeg = (donors / totalComposition) * 360;
    const beneficiaryDeg = (beneficiaries / totalComposition) * 360;

    return `conic-gradient(
      #059669 0deg ${donorDeg}deg,
      #14b8a6 ${donorDeg}deg ${donorDeg + beneficiaryDeg}deg,
      #f59e0b ${donorDeg + beneficiaryDeg}deg ${
        donorDeg + beneficiaryDeg + (vendors / totalComposition) * 360
      }deg,
      #e2e8f0 ${donorDeg + beneficiaryDeg + (vendors / totalComposition) * 360}deg 360deg
    )`;
  }, [donors, beneficiaries, vendors, totalComposition]);

  const userComposition = useMemo(() => {
    const roleTotal = Math.max(totalComposition, 1);
    return [
      {
        label: "Donatur",
        value: donors,
        percent: Math.round((donors / roleTotal) * 100),
        dotClass: "bg-emerald-600",
        textClass: "text-emerald-700",
      },
      {
        label: "Penerima",
        value: beneficiaries,
        percent: Math.round((beneficiaries / roleTotal) * 100),
        dotClass: "bg-teal-500",
        textClass: "text-teal-700",
      },
      {
        label: "Vendor",
        value: vendors,
        percent: Math.round((vendors / roleTotal) * 100),
        dotClass: "bg-amber-500",
        textClass: "text-amber-700",
      },
    ];
  }, [donors, beneficiaries, vendors, totalComposition]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.035)] ring-1 ring-slate-200">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
          <PieChart className="h-4 w-4 text-emerald-600" />
        </div>
        <h2 className="text-sm font-semibold text-slate-950">Komposisi Pengguna</h2>
      </div>

      <div className="flex flex-1 items-center gap-5 px-4 py-4">
        {/* Pie Chart */}
        <div className="relative h-24 w-24 flex-shrink-0">
          <div className="h-full w-full rounded-full" style={{ background: pieGradient }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-white shadow-sm" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-1 flex-col gap-2">
          {userComposition.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dotClass}`} />
              <span className="text-xs text-slate-600">{item.label}</span>
              <span className={`ml-auto text-xs font-semibold ${item.textClass}`}>
                {item.value} ({item.percent}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
