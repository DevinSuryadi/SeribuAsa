import useSWR from "swr";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { adminSWRConfig } from "@/lib/swr-config";
import type { AdminStats } from "./admin/types";
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
