import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useStaggerChildren } from '../../hooks/useStaggerChildren';
import { Heart, ShieldCheck, ShoppingBasket, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: Heart,
    title: 'Donatur Berdonasi',
    desc: 'Donatur memilih paket donasi nutrisi bulanan atau sekali donasi untuk mendukung keluarga rentan.',
    iconBg: 'rgba(34,197,94,0.1)',
    iconColor: '#16a34a',
  },
  {
    icon: ShieldCheck,
    title: 'Verifikasi & Alokasi',
    desc: 'Data penerima diverifikasi, skor FIES dihitung, dan voucher dialokasikan secara adil berdasarkan kebutuhan.',
    iconBg: 'rgba(34,197,94,0.07)',
    iconColor: '#15803d',
  },
  {
    icon: ShoppingBasket,
    title: 'Belanja Pangan Bergizi',
    desc: 'Penerima menggunakan e-voucher untuk membeli bahan pangan bergizi di mitra vendor terverifikasi.',
    iconBg: 'rgba(0,0,0,0.05)',
    iconColor: '#333',
  },
  {
    icon: TrendingUp,
    title: 'Pantau Dampak',
    desc: 'Pertumbuhan anak dipantau, skor ketahanan pangan diukur, dan dampak dilaporkan secara transparan.',
    iconBg: 'rgba(34,197,94,0.1)',
    iconColor: '#16a34a',
  },
];

export function HowItWorksSection() {
  const titleRef = useScrollReveal({ y: 30 });
  const gridRef = useStaggerChildren({ stagger: 0.15, y: 40 });

  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: '80px 0' }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(255,255,255,0) 60%)',
      }} />
      <div style={{
        position: 'absolute',
        top: 80,
        right: 40,
        width: 288,
        height: 288,
        borderRadius: '50%',
        background: 'rgba(34,197,94,0.05)',
        filter: 'blur(64px)',
        zIndex: -1,
      }} />
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 40,
        width: 256,
        height: 256,
        borderRadius: '50%',
        background: 'rgba(34,197,94,0.07)',
        filter: 'blur(64px)',
        zIndex: -1,
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div ref={titleRef} style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 36px)',
              fontWeight: 700,
              color: '#111',
              letterSpacing: '-0.5px',
              margin: 0,
            }}
          >
            Cara Kerja SeribuAsa
          </h2>
          <p
            style={{
              marginTop: 12,
              fontSize: 15,
              color: '#666',
              maxWidth: 600,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            Dari donasi hingga nutrisi di meja makan, setiap langkah transparan dan terukur.
          </p>
        </div>

        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            maxWidth: 960,
            margin: '0 auto',
          }}
        >
          {steps.map((step, i) => (
            <div
              key={step.title}
              style={{
                position: 'relative',
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.08)',
                background: '#fff',
                padding: '28px 24px 24px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: 20,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                {i + 1}
              </div>

              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: step.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <step.icon style={{ width: 26, height: 26, color: step.iconColor }} />
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: 0 }}>
                {step.title}
              </h3>
              <p style={{ marginTop: 8, fontSize: 13, color: '#777', lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}