import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { AdminStats } from "../types";

interface PriorityTasksProps {
  stats: AdminStats;
}

export function PriorityTasks({ stats }: PriorityTasksProps) {
  const pendingBeneficiaries = stats?.users?.pending_beneficiaries || 0;
  const pendingVendors = stats?.users?.pending_vendors || 0;
  const pendingProducts = stats?.products?.pending || 0;
  const pendingOrders = Math.max((stats?.orders?.total || 0) - (stats?.orders?.completed || 0), 0);

  const priorityTasks = [
    {
      title: "Kelayakan penerima",
      desc: "Tinjau pengajuan penerima manfaat",
      summary: `${pendingBeneficiaries} pengajuan menunggu tinjauan`,
      count: pendingBeneficiaries,
      href: "/dashboard/admin/beneficiaries",
      accent: "bg-emerald-500",
      priorityLabel: "Tinggi",
      priorityClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    },
    {
      title: "Pesanan masuk",
      desc: "Konfirmasi pesanan yang belum selesai",
      summary: `${pendingOrders} pesanan perlu diproses`,
      count: pendingOrders,
      href: "/dashboard/admin/orders",
      accent: "bg-teal-500",
      priorityLabel: "Menengah",
      priorityClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    },
    {
      title: "Produk tertunda",
      desc: "Tinjau produk yang menunggu persetujuan",
      summary: `${pendingProducts} produk menunggu tinjauan`,
      count: pendingProducts,
      href: "/dashboard/admin/products",
      accent: "bg-sky-500",
      priorityLabel: "Menengah",
      priorityClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    },
    {
      title: "Validasi vendor",
      desc: "Verifikasi akun vendor baru",
      summary: `${pendingVendors} vendor menunggu verifikasi`,
      count: pendingVendors,
      href: "/dashboard/admin/users",
      accent: "bg-lime-500",
      priorityLabel: "Rendah",
      priorityClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    },
  ];

  const activePriorityTasks = priorityTasks.filter((task) => task.count > 0);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.035)] ring-1 ring-slate-200">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-500 via-teal-400 to-amber-300" />

      <div className="relative flex h-full flex-col px-4 py-3.5 pl-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[0.95rem] font-semibold tracking-[-0.02em] text-slate-950">
              Tugas Prioritas
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Ringkasan pekerjaan yang perlu dipantau.
            </p>
          </div>

          <span
            className={[
              "rounded-full px-2.5 py-1 text-[10px] font-semibold",
              activePriorityTasks.length > 0
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
            ].join(" ")}
          >
            {activePriorityTasks.length > 0 ? `${activePriorityTasks.length} aktif` : "Aman"}
          </span>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-[18px] bg-slate-50/70">
          {priorityTasks.map((task, index) => {
            const hasTask = task.count > 0;

            return (
              <div
                key={task.title}
                className={[
                  "grid flex-1 items-center gap-3 px-3.5 py-2.5 transition hover:bg-white/80 md:grid-cols-[1.25fr_0.7fr_auto_auto]",
                  index !== priorityTasks.length - 1 ? "border-b border-slate-100" : "",
                ].join(" ")}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={[
                      "h-2.5 w-2.5 flex-shrink-0 rounded-full",
                      hasTask ? task.accent : "bg-slate-300",
                    ].join(" ")}
                  />

                  <div className="min-w-0">
                    <p
                      className={[
                        "text-xs font-semibold",
                        hasTask ? "text-slate-950" : "text-slate-500",
                      ].join(" ")}
                    >
                      {task.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{task.desc}</p>
                  </div>
                </div>

                <p
                  className={["text-[11px]", hasTask ? "text-slate-600" : "text-slate-400"].join(
                    " "
                  )}
                >
                  {task.summary}
                </p>

                <span
                  className={[
                    "w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                    hasTask ? task.priorityClass : "bg-slate-100 text-slate-400",
                  ].join(" ")}
                >
                  {task.priorityLabel}
                </span>

                <Link
                  to={task.href}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:text-emerald-600 hover:ring-emerald-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
