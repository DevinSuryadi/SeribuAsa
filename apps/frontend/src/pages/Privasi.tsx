import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { SEO } from "../components/SEO";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { Shield, Database, Eye, UserCheck, Cookie, FileText, Mail } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "Data yang Dikumpulkan",
    content:
      "Kami mengumpulkan data pribadi yang diperlukan untuk menjalankan layanan, termasuk nama lengkap, alamat email, nomor identitas (NIK untuk penerima manfaat), data profil keluarga, dan riwayat transaksi donasi. Data dikumpulkan secara langsung dari pengguna saat pendaftaran, pengisian survei, dan proses transaksi.",
  },
  {
    icon: Eye,
    title: "Penggunaan Data",
    content:
      "Data yang dikumpulkan digunakan untuk: verifikasi identitas dan kelayakan penerima manfaat, alokasi dan distribusi e-voucher nutrisi, pemantauan dampak donasi, penyusunan laporan transparansi, dan komunikasi terkait layanan. Data tidak akan dibagikan kepada pihak ketiga tanpa persetujuan pengguna, kecuali diwajibkan oleh hukum.",
  },
  {
    icon: Shield,
    title: "Perlindungan Data",
    content:
      "Kami menerapkan langkah-langkah keamanan teknis dan organisasi untuk melindungi data pribadi, termasuk enkripsi data saat transit dan penyimpanan, row-level security pada database, masking data sensitif (NIK, informasi keuangan), akses terbatas berdasarkan peran, dan audit log untuk semua aktivitas sistem.",
  },
  {
    icon: UserCheck,
    title: "Hak Pengguna",
    content:
      "Sebagai pengguna, Anda berhak untuk: mengakses data pribadi yang kami simpan, meminta koreksi data yang tidak akurat, meminta penghapusan data (hak untuk dilupakan), menarik persetujuan pemrosesan data, dan mendapatkan salinan data dalam format yang dapat dibaca. Untuk menggunakan hak-hak ini, silakan hubungi kami di privasi@seribuasa.id.",
  },
  {
    icon: Cookie,
    title: "Cookie & Teknologi Pelacakan",
    content:
      "Kami menggunakan cookie dan teknologi serupa untuk meningkatkan pengalaman pengguna, menganalisis penggunaan platform, dan memastikan keamanan. Cookie yang digunakan meliputi: cookie esensial (autentikasi, keamanan), cookie fungsional (preferensi pengguna), dan cookie analitik (statistik penggunaan). Anda dapat mengelola preferensi cookie melalui pengaturan browser.",
  },
  {
    icon: FileText,
    title: "Perubahan Kebijakan",
    content:
      "Kebijakan privasi ini dapat diperbarui dari waktu ke waktu untuk mencerminkan perubahan praktik layanan atau persyaratan hukum. Perubahan material akan diinformasikan melalui email atau notifikasi pada platform. Tanggal pembaruan terakhir akan dicantumkan di bagian atas dokumen ini.",
  },
  {
    icon: Mail,
    title: "Kontak",
    content:
      "Jika Anda memiliki pertanyaan atau kekhawatiran mengenai kebijakan privasi ini, silakan hubungi kami di privasi@seribuasa.id atau melalui halaman Kontak di platform ini.",
  },
];

export default function Privasi() {
  const heroRef = useScrollReveal({ y: 30 });
  const contentRef = useScrollReveal({ y: 30 });

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <SEO
        title="Kebijakan Privasi"
        description="Kebijakan privasi SeribuAsa menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi pengguna platform donasi pangan."
        canonical="https://seribuasa.id/privasi"
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
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Kebijakan <span className="text-green-600">Privasi</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
              Terakhir diperbarui: April 2026. Kebijakan ini menjelaskan bagaimana kami
              mengumpulkan, menggunakan, dan melindungi data pribadi Anda.
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
                <p className="text-sm text-gray-500 leading-relaxed pl-0 sm:pl-13">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
