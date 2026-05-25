import { Link } from "react-router-dom";
import { Users, UserCheck, ShoppingCart, BarChart3, ChevronRight } from "lucide-react";

const quickLinks = [
  {
    label: "Kelola Pengguna",
    desc: "Kelola akun dan peran pengguna",
    href: "/dashboard/admin/users",
    icon: Users,
    iconWrap: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Tinjau Kelayakan",
    desc: "Tinjau pengajuan kelayakan penerima",
    href: "/dashboard/admin/beneficiaries",
    icon: UserCheck,
    iconWrap: "bg-amber-50 text-amber-700",
  },
  {
    label: "Kelola Pesanan",
    desc: "Lihat dan proses pesanan masuk",
    href: "/dashboard/admin/orders",
    icon: ShoppingCart,
    iconWrap: "bg-teal-50 text-teal-700",
  },
  {
    label: "Laporan & Analitik",
    desc: "Lihat data dan insight penting",
    href: "/dashboard/admin/reports",
    icon: BarChart3,
    iconWrap: "bg-sky-50 text-sky-700",
  },
];

export function QuickLinks() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.035)] ring-1 ring-slate-200">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">Akses Cepat</h2>
      </div>

      <div className="flex flex-1 flex-col divide-y divide-slate-100">
        {quickLinks.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.label}
              to={link.href}
              className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${link.iconWrap}`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900">{link.label}</p>
                <p className="text-[11px] text-slate-500">{link.desc}</p>
              </div>

              <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:text-slate-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
