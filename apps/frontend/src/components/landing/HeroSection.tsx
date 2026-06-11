import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import bgHero from '@/assets/bg-hero.svg';

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
        .from('.hero-stats', { y: 20, opacity: 0, duration: 0.5 }, '-=0.2')
        .from('.hero-curves path', { x: 100, opacity: 0, duration: 1, stagger: 0.2 }, '-=0.8');
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
  ref={heroRef}
  style={{
    position: 'relative',
    overflow: 'hidden',
    padding: 'clamp(100px, 18vh, 160px) 0 clamp(40px, 8vh, 64px)',
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    backgroundImage: `
      linear-gradient(
        90deg,
        rgba(4, 35, 22, 0.78) 0%,
        rgba(4, 35, 22, 0.62) 34%,
        rgba(4, 35, 22, 0.22) 62%,
        rgba(4, 35, 22, 0.08) 100%
      ),
      url(${bgHero})
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }}

    >

      {/* Konten Utama */}
      <div style={{ 
        position: 'relative',
        zIndex: 2, 
        width: '100%',
        maxWidth: 1300, 
        margin: '0 auto', 
        padding: '0 clamp(16px, 5vw, 24px)', 
      }}>
        <div style={{ maxWidth: 650 }}>
          {/* Badge */}
          <div
            className="hero-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              border: '1px solid rgba(134,239,172,0.5)',
              background: 'rgba(22,163,74,0.12))',
              fontSize: 'clamp(13px, 3.5vw, 16px)',
              fontWeight: 500,
              color: '#86efac',
              marginBottom: 'clamp(16px, 4vw, 24px)',
            }}
          >
            Ekosistem Ketahanan Pangan & Gizi Indonesia
          </div>

          <h1
            className="hero-title"
            style={{
              fontSize: 'clamp(32px, 5vw, 50px)',
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#ffffff',
              letterSpacing: '-1px',
              margin: '0 0 24px 0',
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
              fontSize: 'clamp(15px, 2vw, 17px)',
              color: 'rgba(255, 255, 255, 0.82)',
              lineHeight: 1.7,
              margin: '0 0 36px 0',
            }}
          >
            SeribuAsa menghubungkan donatur dengan keluarga rentan melalui sistem e-voucher nutrisi,
            memastikan setiap bantuan tepat sasaran untuk pangan bergizi.
          </p>

          {/* CTA */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 16,
              marginBottom: 10
            }}
          >
            <Link
              to="/donasi"
              className="hero-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
              }}
            >
              Mulai Donasi
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/register?role=beneficiary"
              className="hero-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                color: '#ffffff',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent'
              }}
            >
              <Users size={18} />
              Daftar Penerima Manfaat
            </Link>
          </div>

          {/* Stats */}
          <div
            className="hero-stats"
            style={{
              marginTop: 64,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 24,
              borderTop: '1px solid #eee',
              paddingTop: 32,
            }}
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div
                  style={{
                    fontSize: 'clamp(24px, 3vw, 24px)',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ marginTop: 4, fontSize: 14, color: 'rgba(255, 255, 255, 0.82)', fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}