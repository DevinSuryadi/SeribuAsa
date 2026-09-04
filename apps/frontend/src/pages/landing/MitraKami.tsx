import { useState, useEffect } from "react";
import useSWR from "swr";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SEO } from "@/components/SEO";
import { apiFetch } from "@/services/api";
import { staticSWRConfig } from "@/lib/swr-config";
import { Store, MapPin, Search, CalendarDays, X, CheckCircle, Navigation, Star, Clock } from "lucide-react";

type PublicVendor = {
  store_name: string;
  store_address: string;
  join_date: string;
  store_image_url: string;
  operating_hours: string;
  rating: number;
  total_transactions: number;
};

export default function MitraKami() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<PublicVendor | null>(null);

  const { data: vendors, isLoading, error } = useSWR<PublicVendor[]>(
    "/users/public/vendors",
    apiFetch,
    staticSWRConfig
  );

  const filteredVendors = vendors?.filter((v) =>
    v.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.store_address.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Close modal on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedVendor(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className="mitra-page min-h-screen relative overflow-hidden">
      <SEO
        title="Jejaring Mitra Kami"
        description="Temukan jaringan warung dan mitra vendor SeribuAsa yang menjadi pahlawan garda depan dalam distribusi nutrisi untuk keluarga Indonesia."
        canonical="https://seribuasa.id/mitra"
      />
      
      <style>
        {`
          .mitra-page,
          .mitra-page * {
            box-sizing: border-box;
          }

          .mitra-page {
            position: relative;
            background:
              radial-gradient(circle at 0% 10%, rgba(47, 111, 70, 0.11) 0%, transparent 24%),
              radial-gradient(circle at 100% 18%, rgba(47, 111, 70, 0.09) 0%, transparent 24%),
              linear-gradient(180deg, #fbf6ec 0%, #f7f1e5 100%);
            color: #173b2a;
          }

          .mitra-bg-left,
          .mitra-bg-right {
            position: absolute;
            pointer-events: none;
            z-index: 0;
            background: #2f6f46;
          }

          .mitra-bg-left {
            left: -260px;
            top: 110px;
            width: 420px;
            height: 490px;
            opacity: 0.10;
            border-radius: 52% 48% 62% 38% / 46% 58% 42% 54%;
            transform: rotate(-18deg);
          }

          .mitra-bg-right {
            right: -300px;
            top: 210px;
            width: 480px;
            height: 540px;
            opacity: 0.10;
            border-radius: 48% 52% 38% 62% / 54% 42% 58% 46%;
            transform: rotate(16deg);
          }

          .mitra-main {
            position: relative;
            z-index: 2;
          }

          .mitra-container {
            width: 100%;
            max-width: 1180px;
            margin: 0 auto;
            padding-inline: clamp(18px, 4vw, 34px);
          }

          .mitra-title {
            font-family: Georgia, "Times New Roman", serif;
            font-size: clamp(36px, 5vw, 56px);
            line-height: 1.1;
            letter-spacing: -0.055em;
            font-weight: 850;
            color: #154632;
            margin-bottom: 16px;
          }

          .mitra-subtitle {
            color: #617166;
            font-size: clamp(15px, 1.6vw, 17px);
            line-height: 1.8;
            max-width: 700px;
            margin: 0 auto;
          }

          .mitra-card {
            position: relative;
            overflow: hidden;
            border-radius: 26px;
            padding: 24px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.66));
            border: 1px solid rgba(47, 111, 70, 0.11);
            box-shadow: 0 20px 42px rgba(29, 68, 44, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.80);
            backdrop-filter: blur(10px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .mitra-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 28px 50px rgba(29, 68, 44, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.90);
            border-color: rgba(47, 111, 70, 0.25);
          }

          .mitra-card-icon-wrap {
            width: 52px;
            height: 52px;
            border-radius: 18px;
            background: rgba(47, 111, 70, 0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            color: #2f6f46;
            transition: all 0.3s ease;
          }

          .mitra-card:hover .mitra-card-icon-wrap {
            background: #2f6f46;
            color: #ffffff;
            transform: scale(1.05);
          }

          .mitra-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(21, 70, 50, 0.4);
            backdrop-filter: blur(8px);
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.2s ease-out;
          }

          .mitra-modal-content {
            background: #fbf6ec;
            width: 100%;
            max-width: 500px;
            border-radius: 32px;
            padding: 32px;
            position: relative;
            box-shadow: 0 40px 80px rgba(21, 70, 50, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(47, 111, 70, 0.15);
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}
      </style>

      <div className="mitra-bg-left" />
      <div className="mitra-bg-right" />

      <Navbar />

      <main className="mitra-main pt-28 md:pt-36 pb-20 md:pb-32">
        <div className="mitra-container">
          {/* Header */}
          <div className="text-center mb-16 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-900/5 border border-green-900/10 text-green-800 text-sm font-bold mb-6">
              <Store size={16} /> Pahlawan Pangan
            </div>
            <h1 className="mitra-title">
              Jejaring Mitra Kami
            </h1>
            <p className="mitra-subtitle">
              Warung-warung dan mitra lokal yang tergabung dalam ekosistem SeribuAsa. 
              Melalui merekalah donasi Anda tersalurkan menjadi bahan pangan bergizi yang nyata.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-16 relative z-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/40 rounded-2xl blur-xl transition-all group-hover:bg-white/60"></div>
              <div className="relative flex items-center">
                <Search className="absolute left-5 text-[#617166] w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari nama warung atau lokasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-[rgba(47,111,70,0.15)] bg-white/70 backdrop-blur-md shadow-sm focus:border-[#2f6f46] focus:ring-4 focus:ring-[#2f6f46]/10 transition-all outline-none text-[#173b2a] font-medium text-lg placeholder-[#617166]/70"
                />
              </div>
            </div>
          </div>

          {/* States */}
          {error && (
            <div className="text-center p-8 rounded-3xl bg-red-50/80 backdrop-blur border border-red-100 max-w-2xl mx-auto">
              <p className="text-red-600 font-medium">Gagal memuat daftar mitra.</p>
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="mitra-card animate-pulse">
                  <div className="w-12 h-12 bg-[#2f6f46]/10 rounded-xl mb-4" />
                  <div className="h-5 w-3/4 bg-[#2f6f46]/10 rounded mb-3" />
                  <div className="h-4 w-full bg-[#2f6f46]/5 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-[#2f6f46]/5 rounded" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && filteredVendors.length === 0 && (
            <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border border-[rgba(47,111,70,0.1)]">
              <div className="w-20 h-20 bg-[#2f6f46]/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="w-10 h-10 text-[#2f6f46]/40" />
              </div>
              <h3 className="text-xl font-bold text-[#154632] mb-2">Tidak ada mitra ditemukan</h3>
              <p className="text-[#617166]">Coba gunakan kata kunci pencarian lain.</p>
            </div>
          )}

          {/* Grid */}
          {!isLoading && !error && filteredVendors.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {filteredVendors.map((vendor, idx) => (
                <div 
                  key={idx}
                  className="mitra-card group"
                  onClick={() => setSelectedVendor(vendor)}
                >
                  <div className="w-[calc(100%+48px)] h-40 bg-gray-100 -mt-6 -mx-6 mb-5 overflow-hidden">
                    <img 
                      src={vendor.store_image_url} 
                      alt={vendor.store_name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-1 mb-1.5 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-sm text-[#173b2a]">{vendor.rating.toFixed(1)}</span>
                    <span className="text-xs text-[#617166]">({vendor.total_transactions} transaksi)</span>
                  </div>

                  <h3 className="font-bold text-[#154632] text-xl mb-4 line-clamp-1 group-hover:text-[#2f6f46] transition-colors">
                    {vendor.store_name}
                  </h3>
                  
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-start gap-3 text-sm text-[#617166]">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#2f6f46]/60" />
                      <span className="line-clamp-2 leading-relaxed">
                        {vendor.store_address}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-[#617166] font-medium bg-[#2f6f46]/5 p-2.5 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-[#2f6f46]" />
                      <span>Mitra Resmi</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedVendor && (
        <div className="mitra-modal-overlay" onClick={() => setSelectedVendor(null)}>
          <div className="mitra-modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors text-[#154632]"
              onClick={() => setSelectedVendor(null)}
            >
              <X size={18} />
            </button>

            <div className="w-full h-48 bg-gray-100 rounded-2xl overflow-hidden mb-6 mt-2 relative">
              <img 
                src={selectedVendor.store_image_url} 
                alt={selectedVendor.store_name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-bold text-amber-600 shadow-sm">
                <Star className="w-4 h-4 fill-current" />
                {selectedVendor.rating.toFixed(1)} <span className="text-[#617166] text-xs font-medium ml-0.5">({selectedVendor.total_transactions})</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[#154632] mb-2 pr-10">
              {selectedVendor.store_name}
            </h2>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold mb-6">
              <CheckCircle size={14} /> Terverifikasi
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 p-4 bg-white rounded-2xl border border-[rgba(47,111,70,0.1)] shadow-sm">
                <MapPin className="w-5 h-5 text-[#2f6f46] shrink-0 mt-1" />
                <div>
                  <div className="text-xs font-bold text-[#617166] uppercase tracking-wider mb-1">Alamat</div>
                  <div className="text-[#173b2a] leading-relaxed text-sm font-medium">
                    {selectedVendor.store_address}
                  </div>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(selectedVendor.store_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-[#2f6f46] hover:text-[#154632] transition-colors"
                  >
                    <Navigation size={14} /> Buka di Maps
                  </a>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white rounded-2xl border border-[rgba(47,111,70,0.1)] shadow-sm">
                <Clock className="w-5 h-5 text-[#2f6f46] shrink-0 mt-1" />
                <div>
                  <div className="text-xs font-bold text-[#617166] uppercase tracking-wider mb-1">Jam Operasional</div>
                  <div className="text-[#173b2a] font-medium text-sm leading-relaxed">
                    {selectedVendor.operating_hours}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-white rounded-2xl border border-[rgba(47,111,70,0.1)] shadow-sm">
                <CalendarDays className="w-5 h-5 text-[#2f6f46] shrink-0 mt-1" />
                <div>
                  <div className="text-xs font-bold text-[#617166] uppercase tracking-wider mb-1">Bergabung Sejak</div>
                  <div className="text-[#173b2a] font-medium">
                    {new Date(selectedVendor.join_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
