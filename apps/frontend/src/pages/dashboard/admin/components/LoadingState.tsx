import DashboardLayout from "@/components/dashboard/DashboardLayout";

export function LoadingState() {
  return (
    <DashboardLayout
      title="Selamat datang, Admin"
      subtitle="Pantau dan kelola seluruh ekosistem SeribuAsa."
    >
      <div className="flex min-h-[calc(100dvh-9.5rem)] flex-col gap-2.5">
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[78px] animate-pulse rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="mb-2.5 h-3 w-24 rounded-full bg-slate-100" />
              <div className="mb-2 h-5 w-14 rounded-full bg-slate-100" />
              <div className="h-2.5 w-20 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="grid items-stretch gap-2.5 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
          <div className="h-[238px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="h-[238px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>

        <div className="grid flex-1 gap-2.5 xl:grid-cols-[minmax(0,1.26fr)_minmax(280px,0.74fr)]">
          <div className="min-h-[94px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          <div className="min-h-[94px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    </DashboardLayout>
  );
}
