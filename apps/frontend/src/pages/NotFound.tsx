import { Link } from "react-router-dom";
import { Home, ArrowLeft, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * NotFound — 404 page for unmatched routes.
 * Provides navigation back to dashboard or home.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <MapPinOff className="h-10 w-10 text-emerald-600" />
        </div>

        <h1 className="mb-2 text-6xl font-black tracking-tight text-slate-900">404</h1>

        <h2 className="mb-3 text-lg font-bold text-slate-700">
          Halaman Tidak Ditemukan
        </h2>

        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
          Periksa URL atau kembali ke halaman utama.
        </p>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
              Ke Dashboard
            </Link>
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>
      </div>
    </div>
  );
}
