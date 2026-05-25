import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { SEO } from "../components/SEO";
import { useScrollReveal } from "../hooks/useScrollReveal";
import {
  FileText,
  UserPlus,
  CreditCard,
  ShoppingCart,
  Store,
  XCircle,
  RefreshCw,
  Mail,
} from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "Ketentuan Umum",
    content:
      "Dengan mengakses dan menggunakan platform SeribuAsa, Anda menyetujui seluruh syarat dan ketentuan yang berlaku. Platform ini menyediakan layanan donasi nutrisi berbasis e-voucher untuk mendukung ketahanan pangan keluarga rentan di Indonesia. SeribuAsa berhak mengubah ketentuan ini sewaktu-waktu dengan pemberitahuan melalui platform.",
  },
  {
    icon: UserPlus,
    title: "Pendaftaran & Akun",
    content:
      "Pengguna wajib memberikan informasi yang benar, akurat, dan lengkap saat pendaftaran. Setiap akun bersifat pribadi dan tidak dapat dipindahtangankan. Pengguna bertanggung jawab atas keamanan akun dan semua aktivitas yang dilakukan melalui akun mereka. SeribuAsa berhak menangguhkan akun yang melanggar ketentuan atau memberikan informasi palsu.",
  },
  {
    icon: CreditCard,
    title: "Donasi",
    content:
      "Semua donasi bersifat sukarela dan tidak dapat dikembalikan setelah diproses, kecuali terdapat kesalahan teknis yang dibuktikan oleh platform. Donatur akan menerima kwitansi digital dan laporan dampak donasi melalui email. Donasi rutin (berlangganan) dapat dibatalkan kapan saja melalui dashboard donatur.",
  },
  {
    icon: ShoppingCart,
    title: "Voucher Nutrisi",
    content:
      "E-voucher hanya dapat digunakan untuk membeli bahan pangan bergizi dari mitra vendor terverifikasi. Voucher tidak dapat ditukarkan dengan uang tunai, tidak dapat dialihkan ke pengguna lain, dan memiliki masa berlaku. Penyalahgunaan voucher akan mengakibatkan penangguhan akun dan tindakan hukum jika diperlukan.",
  },
  {
    icon: Store,
    title: "Mitra Vendor",
    content:
      "Vendor wajib menyediakan produk pangan bergizi sesuai standar yang ditetapkan. Vendor menerima pembayaran melalui proses settlement berkala. SeribuAsa berhak memutus kerjasama dengan vendor yang melanggar ketentuan atau menjual produk yang tidak sesuai standar.",
  },
  {
    icon: XCircle,
    title: "Pembatalan & Pengembalian",
    content:
      "Donasi yang telah diproses tidak dapat dibatalkan atau dikembalikan. Jika terdapat kesalahan teknis pada platform, SeribuAsa akan melakukan investigasi dan memberikan solusi yang sesuai dalam waktu 14 hari kerja. Donatur dapat membatalkan langganan donasi kapan saja melalui dashboard.",
  },
  {
    icon: RefreshCw,
    title: "Perubahan Ketentuan",
    content:
      "SeribuAsa berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diinformasikan melalui email atau notifikasi pada platform minimal 14 hari sebelum berlaku. Penggunaan berkelanjutan atas platform setelah perubahan berlaku merupakan persetujuan terhadap ketentuan yang diperbarui.",
  },
  {
    icon: Mail,
    title: "Kontak",
    content:
      "Untuk pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami di legal@seribuasa.id atau melalui halaman Kontak di platform ini.",
  },
];

export default function Syarat() {
  const heroRef = useScrollReveal({ y: 30 });
  const contentRef = useScrollReveal({ y: 30 });

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <SEO
        title="Syarat & Ketentuan"
        description="Syarat dan ketentuan penggunaan platform SeribuAsa. Informasi lengkap tentang donasi, voucher nutrisi, hak dan kewajiban pengguna."
        canonical="https://seribuasa.id/syarat"
        noIndex={true}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute -top-16 -left-24 w-96 h-96 rounded-full pointer-events-none z-0"
        style={{ background: "rgba(34,197,94,0.06)", filter: "blur(90px)" }}
      />

      <Navbar />

      <main className="pt-24 md:pt-28 pb-16 md:pb-20 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div ref={heroRef} className="text-center mb-10 md:mb-14">
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Syarat & <span className="text-green-600">Ketentuan</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
              Terakhir diperbarui: April 2026. Dengan menggunakan platform SeribuAsa, Anda
              menyetujui seluruh ketentuan yang berlaku.
            </p>
          </div>

          <div ref={contentRef} className="flex flex-col gap-5">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <section.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">{section.title}</h2>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
