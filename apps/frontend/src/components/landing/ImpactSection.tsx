import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import impactBg from '../../assets/cta-bg.svg';

const stats = [
  {
    end: 12500,
    prefix: '',
    suffix: '+',
    label: 'Penerima Manfaat Aktif',
    desc: 'Keluarga rentan yang mendapat bantuan nutrisi',
  },
  {
    end: 45000,
    prefix: '',
    suffix: '+',
    label: 'Voucher Tersalurkan',
    desc: 'E-voucher nutrisi berhasil ditukarkan',
  },
  {
    end: 4200,
    prefix: 'Rp',
    suffix: 'Jt',
    label: 'Dana Tersalurkan',
    desc: 'Total donasi yang telah disalurkan',
  },
  {
    end: 87,
    prefix: '',
    suffix: '%',
    label: 'Tingkat Penukaran',
    desc: 'Voucher berhasil digunakan tepat sasaran',
  },
];

export function ImpactSection() {
  const sectionRef = useScrollReveal({ y: 24 });

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: `url(${impactBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: 'clamp(34px, 6vw, 56px) 0 clamp(80px, 10vw, 120px)',
      }}
    >
      {/* Overlay hijau biar warnanya sama kayak CTA */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(6, 26, 16, 0.74) 0%, rgba(6, 26, 16, 0.78) 45%, rgba(6, 26, 16, 0.84) 100%), rgba(28, 91, 54, 0.38)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Subtle highlight bawah */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at 50% 100%, rgba(255,255,255,0.055), transparent 50%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 920,
          margin: '0 auto',
          padding: '0 clamp(18px, 5vw, 32px)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          {stats.map((stat, index) => (
            <ImpactStat
              key={stat.label}
              {...stat}
              showDivider={index !== stats.length - 1}
            />
          ))}
        </div>
      </div>

      {/* White wave bottom */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-4%',
          right: '-4%',
          bottom: -1,
          zIndex: 3,
          height: 'clamp(58% 70% at 50% 100%)',
          background: '#fbf6ec',
          clipPath: 'ellipse(66% 54% at 50% 100%)',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -72,
          height: 72,
          background: '#ffffff',
          zIndex: 2,
        }}
      />
    </section>
  );
}

function ImpactStat({
  end,
  prefix,
  suffix,
  label,
  desc,
  showDivider,
}: (typeof stats)[number] & { showDivider: boolean }) {
  const { ref, display } = useCountUp({
    end,
    prefix,
    suffix,
    separator: '.',
  });

  return (
    <div
      title={desc}
      style={{
        position: 'relative',
        textAlign: 'center',
        padding: '0 clamp(10px, 2vw, 26px)',
      }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        style={{
          fontSize: 'clamp(25px, 4vw, 38px)',
          lineHeight: 1,
          fontWeight: 800,
          color: '#fffaf0',
          letterSpacing: '-0.8px',
          textShadow: '0 3px 18px rgba(0,0,0,0.28)',
        }}
      >
        {display}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 'clamp(8px, 1.1vw, 10px)',
          lineHeight: 1.2,
          fontWeight: 800,
          color: 'rgba(255,250,240,0.86)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          maxWidth: 124,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {label}
      </div>

      {showDivider && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            width: 1,
            height: 58,
            background:
              'linear-gradient(180deg, transparent, rgba(255,250,240,0.32), transparent)',
          }}
        />
      )}
    </div>
  );
}