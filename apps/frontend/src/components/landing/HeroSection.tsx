import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
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
        padding: '160px 0 64px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff'
      }}
    >
      {/* Background Gradient & Blurs */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
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
          zIndex: 0,
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
          zIndex: 0,
        }}
      />

      {/* SVG Geometric Curves - Smooth & Organic */}
      <div 
        className="hero-curves"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '60%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      >
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMaxYMid slice"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Layer 1: Hijau Tua (Dark Forest) - Lengkungan paling luar */}
          <path
            d="M 1000 0 
               C 850 150, 750 300, 650 500 
               C 550 700, 400 850, 200 1000 
               L 1000 1000 
               Z"
            fill="#064e3b"
            opacity="0.9"
          />
          
          {/* Layer 2: Hijau Cerah (Primary Green) - Lengkungan tengah */}
          <path
            d="M 1000 50 
               C 900 180, 820 320, 730 520 
               C 640 720, 500 870, 320 1000 
               L 1000 1000 
               Z"
            fill="#22c55e"
            opacity="0.85"
          />
          
          {/* Layer 3: Hijau Terang - Lengkungan dalam */}
          <path
            d="M 1000 100 
               C 950 200, 880 340, 800 540 
               C 720 740, 580 880, 440 1000 
               L 1000 1000 
               Z"
            fill="#4ade80"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* Konten Utama */}
      <div style={{ 
        position: 'relative',
        zIndex: 2, 
        width: '100%',
        maxWidth: 1300, 
        margin: '0 auto', 
        padding: '0 24px', 
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
              fontSize: 'clamp(32px, 5vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#111',
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
              fontSize: 'clamp(15px, 2vw, 20px)',
              color: '#666',
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
              to="/daftar"
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
              to="/daftar?role=beneficiary"
              className="hero-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                color: '#333',
                textDecoration: 'none',
                border: '1px solid rgba(0,0,0,0.15)',
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
                    fontSize: 'clamp(24px, 3vw, 32px)',
                    fontWeight: 800,
                    color: '#111',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ marginTop: 4, fontSize: 14, color: '#666', fontWeight: 500 }}>
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