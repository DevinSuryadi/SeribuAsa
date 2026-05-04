import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useStaggerChildren } from '../../hooks/useStaggerChildren';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Ibu Sari Wulandari',
    role: 'Penerima Manfaat, Jakarta Timur',
    text: 'Dengan NutriGuard, anak saya bisa mendapat telur, susu, dan sayuran segar setiap minggu. Gizinya jauh lebih baik sekarang.',
  },
  {
    name: 'Ahmad Fauzi',
    role: 'Donatur Individu',
    text: 'Saya bisa melihat dampak donasi saya secara langsung. Transparan dan terpercaya — itulah yang membuat saya terus berdonasi.',
  },
  {
    name: 'PT Sejahtera Pangan',
    role: 'Donatur Korporat',
    text: 'Program CSR kami melalui NutriGuard memberikan laporan dampak yang jelas untuk para stakeholder.',
  },
];



export function TrustSection() {
  const titleRef = useScrollReveal({ y: 30 });
  const gridRef = useStaggerChildren({ stagger: 0.15 });

  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(48px, 8vh, 80px) 0' }}>
      {/* Background blobs */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: -1,
        background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(255,255,255,0) 60%)',
      }} />
      <div style={{
        position: 'absolute',
        top: 60,
        right: 20,
        width: 'clamp(150px, 30vw, 288px)',
        height: 'clamp(150px, 30vw, 288px)',
        borderRadius: '50%',
        background: 'rgba(34,197,94,0.05)',
        filter: 'blur(64px)',
        zIndex: -1,
      }} />
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        width: 'clamp(120px, 25vw, 256px)',
        height: 'clamp(120px, 25vw, 256px)',
        borderRadius: '50%',
        background: 'rgba(34,197,94,0.07)',
        filter: 'blur(64px)',
        zIndex: -1,
      }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px, 5vw, 24px)' }}>
        <div ref={titleRef} style={{ textAlign: 'center', marginBottom: 'clamp(32px, 6vw, 48px)' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 36px)',
              fontWeight: 700,
              color: '#111',
              letterSpacing: '-0.5px',
              margin: 0,
            }}
          >
            Dipercaya Ribuan Pengguna
          </h2>
          <p style={{ marginTop: 10, fontSize: 15, color: '#666' }}>
            Cerita dari ekosistem SeribuAsa.
          </p>
        </div>

        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
            maxWidth: 960,
            margin: '0 auto',
          }}
        >
          {testimonials.map((t) => (
            <div
              key={t.name}
              style={{
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.08)',
                background: '#fff',
                padding: '24px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    style={{ width: 14, height: 14, fill: '#22c55e', color: '#22c55e' }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
                "{t.text}"
              </p>
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: '1px solid rgba(0,0,0,0.07)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}