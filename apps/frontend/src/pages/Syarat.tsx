import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { FileText, UserPlus, CreditCard, ShoppingCart, Store, XCircle, RefreshCw, Mail } from 'lucide-react';

const sections = [
  { icon: FileText, title: 'Ketentuan Umum', content: 'Dengan mengakses dan menggunakan platform SeribuAsa, Anda menyetujui seluruh syarat dan ketentuan yang berlaku. Platform ini menyediakan layanan donasi nutrisi berbasis e-voucher untuk mendukung ketahanan pangan keluarga rentan di Indonesia. SeribuAsa berhak mengubah ketentuan ini sewaktu-waktu dengan pemberitahuan melalui platform.' },
  { icon: UserPlus, title: 'Pendaftaran & Akun', content: 'Pengguna wajib memberikan informasi yang benar, akurat, dan lengkap saat pendaftaran. Setiap akun bersifat pribadi dan tidak dapat dipindahtangankan. Pengguna bertanggung jawab atas keamanan akun dan semua aktivitas yang dilakukan melalui akun mereka. SeribuAsa berhak menangguhkan akun yang melanggar ketentuan atau memberikan informasi palsu.' },
  { icon: CreditCard, title: 'Donasi', content: 'Semua donasi bersifat sukarela dan tidak dapat dikembalikan setelah diproses, kecuali terdapat kesalahan teknis yang dibuktikan oleh platform. Donatur akan menerima kwitansi digital dan laporan dampak donasi melalui email. Donasi rutin (berlangganan) dapat dibatalkan kapan saja melalui dashboard donatur.' },
  { icon: ShoppingCart, title: 'Voucher Nutrisi', content: 'E-voucher hanya dapat digunakan untuk membeli bahan pangan bergizi dari mitra vendor terverifikasi. Voucher tidak dapat ditukarkan dengan uang tunai, tidak dapat dialihkan ke pengguna lain, dan memiliki masa berlaku. Penyalahgunaan voucher akan mengakibatkan penangguhan akun dan tindakan hukum jika diperlukan.' },
  { icon: Store, title: 'Mitra Vendor', content: 'Vendor wajib menyediakan produk pangan bergizi sesuai standar yang ditetapkan. Vendor menerima pembayaran melalui proses settlement berkala. SeribuAsa berhak memutus kerjasama dengan vendor yang melanggar ketentuan atau menjual produk yang tidak sesuai standar.' },
  { icon: XCircle, title: 'Pembatalan & Pengembalian', content: 'Donasi yang telah diproses tidak dapat dibatalkan atau dikembalikan. Jika terdapat kesalahan teknis pada platform, SeribuAsa akan melakukan investigasi dan memberikan solusi yang sesuai dalam waktu 14 hari kerja. Donatur dapat membatalkan langganan donasi kapan saja melalui dashboard.' },
  { icon: RefreshCw, title: 'Perubahan Ketentuan', content: 'SeribuAsa berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diinformasikan melalui email atau notifikasi pada platform minimal 14 hari sebelum berlaku. Penggunaan berkelanjutan atas platform setelah perubahan berlaku merupakan persetujuan terhadap ketentuan yang diperbarui.' },
  { icon: Mail, title: 'Kontak', content: 'Untuk pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami di legal@seribuasa.id atau melalui halaman Kontak di platform ini.' },
];

export default function Syarat() {
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
              <FileText style={{ width: 32, height: 32, color: '#16a34a' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#111', letterSpacing: '-1px', margin: 0 }}>
              Syarat & <span style={{ color: '#16a34a' }}>Ketentuan</span>
            </h1>
            <p style={{ marginTop: 16, fontSize: 16, color: '#888', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.75 }}>
              Terakhir diperbarui: April 2026. Dengan menggunakan platform SeribuAsa, Anda menyetujui seluruh ketentuan yang berlaku.
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
