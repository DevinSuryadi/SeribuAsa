import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches render-time errors (including lazy-load failures)
 * and displays a user-friendly fallback instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunkError =
        this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.message?.includes("Loading chunk") ||
        this.state.error?.message?.includes("Loading CSS chunk");

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>

            <h1 className="mb-2 text-xl font-bold text-slate-900">
              {isChunkError ? "Versi Baru Tersedia" : "Terjadi Kesalahan"}
            </h1>

            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              {isChunkError
                ? "Aplikasi telah diperbarui. Silakan muat ulang halaman untuk melanjutkan."
                : "Terjadi kesalahan saat memuat halaman. Silakan coba muat ulang."}
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <RefreshCw className="h-4 w-4" />
                Muat Ulang Halaman
              </button>

              {!isChunkError && (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Coba Lagi
                </button>
              )}
            </div>

            {this.state.error && !isChunkError && (
              <details className="mt-5 text-left">
                <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
                  Detail teknis
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
