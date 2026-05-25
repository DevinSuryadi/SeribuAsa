import { useMemo } from "react";
import { Users, Heart, Package, ClipboardList } from "lucide-react";
import { formatIDR } from "@/lib/format";
import type { AdminStats } from "../types";

interface KPICardsProps {
  stats: AdminStats;
}

export function KPICards({ stats }: KPICardsProps) {
  const kpiCards = useMemo(
    () => [
      {
        label: "Total Pengguna",
        value: stats?.users?.total || 0,
        helper: "Semua peran",
        icon: Users,
        iconClass: "text-emerald-700",
        surface: "bg-emerald-50",
      },
      {
        label: "Total Donasi",
        value: formatIDR(stats?.donations?.total_amount || 0),
        helper: "Dana terkumpul",
        icon: Heart,
        iconClass: "text-green-600",
        surface: "bg-green-50",
      },
      {
        label: "Perlu Ditinjau",
        value:
          (stats?.users?.pending_beneficiaries || 0) +
          (stats?.users?.pending_vendors || 0) +
          (stats?.products?.pending || 0),
        helper: "Item menunggu tinjauan",
        icon: ClipboardList,
        iconClass: "text-amber-600",
        surface: "bg-amber-50",
      },
      {
        label: "Pesanan Selesai",
        value: stats?.orders?.completed || 0,
        helper: `Dari ${stats?.orders?.total || 0} pesanan`,
        icon: Package,
        iconClass: "text-sky-700",
        surface: "bg-sky-50",
      },
    ],
    [stats]
  );

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.024)]">
      <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="flex min-h-[80px] items-center justify-between gap-3 p-3 transition hover:bg-emerald-50/20 sm:min-h-[88px] lg:p-3.5"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-700 sm:text-xs">{card.label}</p>
                <div className="mt-1 text-[1.35rem] font-semibold leading-none tracking-tight text-slate-950 sm:text-[1.55rem]">
                  {card.value}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{card.helper}</p>
              </div>

              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${card.surface}`}
              >
                <Icon className={`h-4 w-4 stroke-[1.8] ${card.iconClass}`} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
