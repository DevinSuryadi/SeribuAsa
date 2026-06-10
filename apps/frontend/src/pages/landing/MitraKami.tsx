import { useState } from "react";
import useSWR from "swr";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";
import { apiFetch } from "@/services/api";
import { staticSWRConfig } from "@/lib/swr-config";
import { Store, MapPin, Search, CalendarDays } from "lucide-react";

type PublicVendor = {
  store_name: string;
  store_address: string;
  join_date: string;
};

export default function MitraKami() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vendors, isLoading, error } = useSWR<PublicVendor[]>(
    "/users/public/vendors",
    apiFetch,
    staticSWRConfig
  );

  const filteredVendors = vendors?.filter((v) =>
    v.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.store_address.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <SEO
        title="Jejaring Mitra Kami"
        description="Temukan jaringan warung dan mitra vendor SeribuAsa yang menjadi pahlawan garda depan dalam distribusi nutrisi untuk keluarga Indonesia."
        canonical="https://seribuasa.id/mitra"
      />
      
      {/* Background decorations */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.06) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute top-40 right-[-100px] w-96 h-96 rounded-full pointer-events-none z-0"
        style={{ background: "rgba(34,197,94,0.04)", filter: "blur(90px)" }}
      />

      <Navbar />

      <main className="pt-24 md:pt-32 pb-16 md:pb-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Jejaring <span className="text-green-600">Mitra Kami</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Warung-warung dan mitra lokal yang tergabung dalam ekosistem SeribuAsa. 
              Melalui merekalah donasi Anda tersalurkan menjadi bahan pangan bergizi yang nyata.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari nama warung atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none text-gray-700"
              />
            </div>
          </div>

          {/* Error & Loading States */}
          {error && (
            <div className="text-center p-8 rounded-2xl bg-red-50 border border-red-100 max-w-2xl mx-auto">
              <p className="text-red-600 font-medium">Gagal memuat daftar mitra.</p>
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-6 animate-pulse shadow-sm">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl mb-4" />
                  <div className="h-5 w-3/4 bg-gray-100 rounded mb-3" />
                  <div className="h-4 w-full bg-gray-50 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-gray-50 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredVendors.length === 0 && (
            <div className="text-center py-16">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">Tidak ada mitra ditemukan</h3>
              <p className="text-gray-500 text-sm">Coba gunakan kata kunci pencarian lain.</p>
            </div>
          )}

          {/* Grid */}
          {!isLoading && !error && filteredVendors.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor, idx) => {
                const date = new Date(vendor.join_date).toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric"
                });

                return (
                  <div 
                    key={idx}
                    className="group rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-md p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:border-green-100"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-green-100 transition-all duration-300">
                      <Store className="w-6 h-6 text-green-600" />
                    </div>
                    
                    <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-1">
                      {vendor.store_name}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">
                          {vendor.store_address}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2.5 text-sm text-gray-500">
                        <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>Mitra sejak {date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
