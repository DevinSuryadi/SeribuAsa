import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Gagal memuat data",
  message,
  onRetry,
  retryLabel = "Coba Lagi",
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4 ${className}`}>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-5 w-5 text-red-600" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-red-800 mb-1">{title}</h3>
        <p className="text-sm text-red-600 mb-3">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-red-300 text-red-700 bg-white hover:bg-red-50"
          >
            <RefreshCw className="mr-2 h-3 w-3" /> {retryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
