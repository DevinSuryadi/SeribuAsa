import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useStaggerChildren } from '../../hooks/useStaggerChildren';
import { Wheat, HeartPulse, Scale } from 'lucide-react';

const sdgs = [
  {
    icon: Wheat,
    title: 'SDG 2: Zero Hunger',
    desc: 'Menghapus kelaparan dan memastikan akses pangan bergizi bagi semua.',
    iconBg: 'rgba(234,179,8,0.12)',
    iconColor: '#a16207',
  },
  {
    icon: HeartPulse,
    title: 'SDG 3: Kesehatan yang Baik',
    desc: 'Mendukung nutrisi ibu hamil dan 1000 Hari Pertama Kehidupan.',
    iconBg: 'rgba(34,197,94,0.1)',
    iconColor: '#16a34a',
  },
  {
    icon: Scale,
    title: 'SDG 10: Mengurangi Ketimpangan',
    desc: 'Distribusi bantuan yang adil berdasarkan data dan skor ketahanan pangan.',
    iconBg: 'rgba(0,0,0,0.05)',
    iconColor: '#444',
  },
];

export function SDGSection() {
  const titleRef = useScrollReveal({ y: 30 });
  const gridRef = useStaggerChildren({ stagger: 0.15 });

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
        <div ref={titleRef} style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 36px)',
              fontWeight: 700,
              color: '#111',
              letterSpacing: '-0.5px',
              margin: 0,
            }}
          >
            Sejalan dengan Tujuan Pembangunan Berkelanjutan
          </h2>
          <p
            style={{
              marginTop: 12,
              fontSize: 15,
              color: '#666',
              maxWidth: 520,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            NutriGuard berkontribusi langsung pada pencapaian SDGs Indonesia.
          </p>
        </div>

        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            maxWidth: 860,
            margin: '0 auto',
          }}
        >
          {sdgs.map((sdg) => (
            <div
              key={sdg.title}
              style={{
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.08)',
                background: '#fff',
                padding: '28px 24px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
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
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: sdg.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <sdg.icon style={{ width: 26, height: 26, color: sdg.iconColor }} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: 0 }}>
                {sdg.title}
              </h3>
              <p style={{ marginTop: 8, fontSize: 13, color: '#777', lineHeight: 1.6 }}>
                {sdg.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}