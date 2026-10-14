import useSWR from "swr";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { adminSWRConfig } from "@/lib/swr-config";
import type { AdminStats } from "./admin/types";
import type { FacilityPayout } from "@/services/facility-payouts";
import type { FacilityOrder } from "@/services/facility-orders";
import type { AdminFacility } from "@/services/admin-facilities";
import {
  KPICards,
  PriorityTasks,
  UserComposition,
  ExportSection,
  QuickLinks,
  LoadingState,
  ErrorState,
} from "./admin/components";

function AdminDashboardContent() {
  const {
    data: stats,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminStats>("/admin/stats", adminSWRConfig);
  const { data: facilityPayouts } = useSWR<FacilityPayout[]>("/admin/facility-payouts?unpaid_only=true", adminSWRConfig);
  const { data: facilityAllocations } = useSWR<FacilityOrder[]>("/admin/facility-orders?pending_only=true", adminSWRConfig);
  const { data: facilities } = useSWR<AdminFacility[]>("/admin/facilities", adminSWRConfig);
  const pendingFacilities = facilities?.filter((item) => item.approval_status === "pending").length || 0;
  const unpaid = facilityPayouts?.filter((item) => item.status !== "paid") || [];
  const overdue = unpaid.filter((item) => item.overdue).length;

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error.message} onRetry={() => mutate()} />;
  }

  if (!stats) {
    return <ErrorState error="Data tidak tersedia" onRetry={() => mutate()} />;
  }

  return (
    <DashboardLayout
      title="Selamat datang, Admin"
      subtitle="Pantau dan kelola seluruh ekosistem SeribuAsa."
    >
      <div className="relative -mx-1 flex min-h-[calc(100dvh-9.5rem)] flex-col gap-2.5 overflow-hidden rounded-[1.25rem] bg-[#fbfffc] px-1 pb-1">
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-100/30 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-40 h-32 w-32 rounded-full bg-amber-50/55 blur-3xl" />

        {unpaid.length > 0 && <Link to="/dashboard/admin/facility-payouts" className={`relative rounded-xl border p-4 text-sm ${overdue ? "border-red-300 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          <strong>{overdue ? `${overdue} pencairan Vendor melewati batas tiga hari` : `${unpaid.length} pencairan Vendor perlu ditindaklanjuti`}</strong>
          <span className="ml-2 underline">Buka antrean pencairan</span>
        </Link>}
        {Boolean(facilityAllocations?.length) && <Link to="/dashboard/admin/facility-allocations" className="relative rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>{facilityAllocations?.length} permintaan Faskes menunggu persetujuan alokasi</strong><span className="ml-2 underline">Tinjau permintaan</span></Link>}
        {pendingFacilities > 0 && <Link to="/dashboard/admin/facilities" className="relative rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>{pendingFacilities} Faskes menunggu verifikasi</strong><span className="ml-2 underline">Tinjau Faskes</span></Link>}

        {/* KPI Cards */}
        <KPICards stats={stats} />

        {/* Priority Tasks & User Composition */}
        <section className="grid items-stretch gap-2.5 xl:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)]">
          <PriorityTasks stats={stats} />
          <UserComposition stats={stats} />
        </section>

        {/* Quick Links & Export */}
        <section className="grid flex-1 gap-2.5 xl:grid-cols-[minmax(0,1.26fr)_minmax(280px,0.74fr)]">
          <QuickLinks />
          <ExportSection />
        </section>
      </div>
    </DashboardLayout>
  );
}

export default function AdminDashboard() {
  return (
    <ErrorBoundary>
      <AdminDashboardContent />
    </ErrorBoundary>
  );
}
