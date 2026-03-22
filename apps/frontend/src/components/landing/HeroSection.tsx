import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {Users, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

const stats = [
  { value: '12.500+', label: 'Penerima Manfaat' },
  { value: '3.200+', label: 'Donatur Aktif' },
  { value: '28', label: 'Provinsi' },
  { value: 'Rp4,2M', label: 'Dana Tersalurkan' },
];

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.6 })
        .from('.hero-title', { y: 30, opacity: 0, duration: 0.8 }, '-=0.3')
        .from('.hero-desc', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-cta', { y: 20, opacity: 0, duration: 0.5, stagger: 0.15 }, '-=0.3')
        .from('.hero-stats', { y: 20, opacity: 0, duration: 0.5 }, '-=0.2');
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '160px 0 64px',
      }}
    >
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(255,255,255,0) 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 40,
          width: 288,
          height: 288,
          borderRadius: '50%',
          background: 'rgba(34,197,94,0.05)',
          filter: 'blur(64px)',
          zIndex: -1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 40,
          width: 256,
          height: 256,
          borderRadius: '50%',
          background: 'rgba(34,197,94,0.07)',
          filter: 'blur(64px)',
          zIndex: -1,
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        {/* Badge */}
        <div
          className="hero-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 999,
            border: '1px solid rgba(34,197,94,0.25)',
            background: 'rgba(34,197,94,0.06)',
            fontSize: 16,
            fontWeight: 500,
            color: '#16a34a',
            marginBottom: 24,
          }}
        >
          Ekosistem Ketahanan Pangan & Gizi Indonesia
        </div>

        <h1
          className="hero-title"
          style={{
          maxWidth: 1200,
          margin: '0 auto',
          fontSize: 'clamp(32px, 5vw, 64px)',
          fontWeight: 800,
          lineHeight: 1.2,
          color: '#111',
          letterSpacing: '-1px',
          }}
        >
        Nutrisi Sehat untuk
        <br />
          <span
            style={{
            background: 'linear-gradient(135deg, #4ade80, #16a34a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            }}
          >
          1000 Hari Pertama Kehidupan
          </span>
        </h1>

        {/* Description */}
        <p
          className="hero-desc"
          style={{
            maxWidth: 600,
            margin: '24px auto 0',
            fontSize: 'clamp(15px, 2vw, 20px)',
            color: '#666',
            lineHeight: 1.7,
          }}
        >
          SeribuAsa menghubungkan donatur dengan keluarga rentan melalui sistem e-voucher nutrisi,
          memastikan setiap bantuan tepat sasaran untuk pangan bergizi.
        </p>

        {/* CTA */}
        <div
          style={{
            marginTop: 36,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <Link
            to="/daftar"
            className="hero-cta"
            style={{
              opacity: 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              color: 'white',
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              boxShadow: '0 2px 12px rgba(34,197,94,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(34,197,94,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(34,197,94,0.3)';
            }}
          >
            Mulai Donasi
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/daftar?role=beneficiary"
            className="hero-cta"
            style={{
              opacity: 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 500,
              color: '#333',
              textDecoration: 'none',
              border: '1px solid rgba(0,0,0,0.15)',
              background: 'transparent',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)';
            }}
          >
            <Users size={16} />
            Daftar Penerima Manfaat
          </Link>
        </div>

        {/* Stats */}
        <div
          className="hero-stats"
          style={{
            marginTop: 64,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 24,
            maxWidth: 720,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {stats.map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 'clamp(22px, 3vw, 30px)',
                  fontWeight: 700,
                  color: '#111',
                  letterSpacing: '-0.5px',
                }}
              >
                {stat.value}
              </div>
              <div style={{ marginTop: 4, fontSize: 15, color: '#888' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}