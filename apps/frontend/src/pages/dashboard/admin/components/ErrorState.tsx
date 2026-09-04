import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <DashboardLayout
      title="Selamat datang, Admin"
      subtitle="Pantau dan kelola seluruh ekosistem SeribuAsa."
    >
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>

          <div className="flex-1">
            <h3 className="mb-1 text-sm font-semibold text-red-800">Gagal memuat data</h3>
            <p className="mb-3 text-sm text-red-600">{error}</p>

            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8 border-red-300 bg-white text-xs text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
