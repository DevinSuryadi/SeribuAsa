import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Shield, Database, Eye, UserCheck, Cookie, FileText, Mail } from 'lucide-react';

const sections = [
  { icon: Database, title: 'Data yang Dikumpulkan', content: 'Kami mengumpulkan data pribadi yang diperlukan untuk menjalankan layanan, termasuk nama lengkap, alamat email, nomor identitas (NIK untuk penerima manfaat), data profil keluarga, dan riwayat transaksi donasi. Data dikumpulkan secara langsung dari pengguna saat pendaftaran, pengisian survei, dan proses transaksi.' },
  { icon: Eye, title: 'Penggunaan Data', content: 'Data yang dikumpulkan digunakan untuk: verifikasi identitas dan kelayakan penerima manfaat, alokasi dan distribusi e-voucher nutrisi, pemantauan dampak donasi, penyusunan laporan transparansi, dan komunikasi terkait layanan. Data tidak akan dibagikan kepada pihak ketiga tanpa persetujuan pengguna, kecuali diwajibkan oleh hukum.' },
  { icon: Shield, title: 'Perlindungan Data', content: 'Kami menerapkan langkah-langkah keamanan teknis dan organisasi untuk melindungi data pribadi, termasuk enkripsi data saat transit dan penyimpanan, row-level security pada database, masking data sensitif (NIK, informasi keuangan), akses terbatas berdasarkan peran, dan audit log untuk semua aktivitas sistem.' },
  { icon: UserCheck, title: 'Hak Pengguna', content: 'Sebagai pengguna, Anda berhak untuk: mengakses data pribadi yang kami simpan, meminta koreksi data yang tidak akurat, meminta penghapusan data (hak untuk dilupakan), menarik persetujuan pemrosesan data, dan mendapatkan salinan data dalam format yang dapat dibaca. Untuk menggunakan hak-hak ini, silakan hubungi kami di privasi@seribuasa.id.' },
  { icon: Cookie, title: 'Cookie & Teknologi Pelacakan', content: 'Kami menggunakan cookie dan teknologi serupa untuk meningkatkan pengalaman pengguna, menganalisis penggunaan platform, dan memastikan keamanan. Cookie yang digunakan meliputi: cookie esensial (autentikasi, keamanan), cookie fungsional (preferensi pengguna), dan cookie analitik (statistik penggunaan). Anda dapat mengelola preferensi cookie melalui pengaturan browser.' },
  { icon: FileText, title: 'Perubahan Kebijakan', content: 'Kebijakan privasi ini dapat diperbarui dari waktu ke waktu untuk mencerminkan perubahan praktik layanan atau persyaratan hukum. Perubahan material akan diinformasikan melalui email atau notifikasi pada platform. Tanggal pembaruan terakhir akan dicantumkan di bagian atas dokumen ini.' },
  { icon: Mail, title: 'Kontak', content: 'Jika Anda memiliki pertanyaan atau kekhawatiran mengenai kebijakan privasi ini, silakan hubungi kami di privasi@seribuasa.id atau melalui halaman Kontak di platform ini.' },
];

export default function Privasi() {
  const heroRef = useScrollReveal({ y: 30 });
  const contentRef = useScrollReveal({ y: 30 });

  return (
    <div style={{ minHeight: '100vh', background: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)' }} />
      <div style={{ position: 'absolute', top: -60, left: -100, zIndex: 0, pointerEvents: 'none', width: 500, height: 500, borderRadius: '50%', background: 'rgba(34,197,94,0.06)', filter: 'blur(90px)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: -80, zIndex: 0, pointerEvents: 'none', width: 420, height: 420, borderRadius: '50%', background: 'rgba(74,222,128,0.06)', filter: 'blur(80px)' }} />

      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 80, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <div ref={heroRef} style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Shield style={{ width: 32, height: 32, color: '#16a34a' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#111', letterSpacing: '-1px', margin: 0 }}>
              Kebijakan <span style={{ color: '#16a34a' }}>Privasi</span>
            </h1>
            <p style={{ marginTop: 16, fontSize: 16, color: '#888', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.75 }}>
              Terakhir diperbarui: April 2026. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.
            </p>
          </div>

          <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {sections.map((section) => (
              <div key={section.title} style={{ borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', padding: '28px 24px', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <section.icon style={{ width: 20, height: 20, color: '#16a34a' }} />
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>{section.title}</h2>
                </div>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, margin: 0, paddingLeft: 52 }}>{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
