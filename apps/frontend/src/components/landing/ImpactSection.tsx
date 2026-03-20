import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const stats = [
  { end: 12500, prefix: '', suffix: '+', label: 'Penerima Manfaat Aktif', desc: 'Keluarga rentan yang mendapat bantuan nutrisi' },
  { end: 45000, prefix: '', suffix: '+', label: 'Voucher Tersalurkan', desc: 'E-voucher nutrisi berhasil ditukarkan' },
  { end: 4200, prefix: 'Rp', suffix: 'Jt', label: 'Dana Tersalurkan', desc: 'Total donasi yang telah disalurkan' },
  { end: 87, prefix: '', suffix: '%', label: 'Tingkat Penukaran', desc: 'Voucher berhasil digunakan tepat sasaran' },
];

export function ImpactSection() {
  const titleRef = useScrollReveal({ y: 30 });

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
            Dampak Nyata
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
            Setiap donasi menciptakan perubahan yang terukur dan transparan.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            maxWidth: 960,
            margin: '0 auto',
          }}
        >
          {stats.map((stat) => (
            <ImpactCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ImpactCard({ end, prefix, suffix, label, desc }: typeof stats[number]) {
  const { ref, display } = useCountUp({ end, prefix, suffix, separator: '.' });

  return (
    <div
      style={{
        textAlign: 'center',
        borderRadius: 14,
        border: '1px solid rgba(0,0,0,0.08)',
        background: '#fff',
        padding: '28px 20px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        style={{
          fontSize: 'clamp(28px, 4vw, 36px)',
          fontWeight: 800,
          color: '#16a34a',
          letterSpacing: '-1px',
        }}
      >
        {display}
      </div>
      <div style={{ marginTop: 8, fontWeight: 600, fontSize: 14, color: '#222' }}>{label}</div>
      <p style={{ marginTop: 4, fontSize: 13, color: '#888', lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}