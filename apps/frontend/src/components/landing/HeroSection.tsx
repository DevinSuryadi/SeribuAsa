import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import bgHero from '@/assets/bg-hero.svg';

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-title-line', {
        y: 28,
        opacity: 0,
        duration: 0.75,
        stagger: 0.12,
      })
        .from('.hero-desc-wrap', { y: 18, opacity: 0, duration: 0.55 }, '-=0.25')
        .from(
          '.hero-cta',
          {
            y: 18,
            opacity: 0,
            duration: 0.45,
            stagger: 0.12,
          },
          '-=0.2'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(138px, 20vh, 190px) 0 clamp(86px, 11vh, 120px)',
        backgroundImage: `
          linear-gradient(
            90deg,
            rgba(2, 22, 14, 0.78) 0%,
            rgba(2, 22, 14, 0.67) 32%,
            rgba(2, 22, 14, 0.38) 56%,
            rgba(2, 22, 14, 0.12) 100%
          ),
          url(${bgHero})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.22) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 1440,
          margin: '0 auto',
          paddingLeft: 'clamp(32px, 6vw, 92px)',
          paddingRight: 'clamp(24px, 5vw, 80px)',
        }}
      >
        <div style={{ maxWidth: 720 }}>
          {/* Title */}
          <h1
            className="hero-title"
            style={{
              margin: 0,
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.7px',
              textShadow: '0 10px 34px rgba(0,0,0,0.26)',
              maxWidth: 700,
            }}
          >
            <span
              className="hero-title-line"
              style={{
                display: 'block',
                fontSize: 'clamp(46px, 5.3vw, 74px)',
                lineHeight: 0.9,
                fontWeight: 700,
              }}
            >
              Nutrisi Sehat
            </span>

            <span
              className="hero-title-line"
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                marginTop: 10,
                marginLeft: 'clamp(24px, 5vw, 86px)',
                flexWrap: 'nowrap',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(28px, 3vw, 40px)',
                  lineHeight: 1,
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                untuk
              </span>

              <span
                style={{
                  fontSize: 'clamp(48px, 5.4vw, 72px)',
                  lineHeight: 0.9,
                  color: '#4ade80',
                  fontWeight: 700,
                }}
              >
                1000 Hari
              </span>
            </span>

            <span
              className="hero-title-line"
              style={{
                display: 'block',
                marginTop: 10,
                fontSize: 'clamp(40px, 4.6vw, 62px)',
                lineHeight: 0.92,
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              Pertama Kehidupan
            </span>
          </h1>

          {/* Description sejajar dengan "Pertama Kehidupan" */}
          <div
            className="hero-desc-wrap"
            style={{
              marginTop: 38,
              maxWidth: 590,
            }}
          >
            <div
            
            />

            <p
              className="hero-desc"
              style={{
                fontSize: 'clamp(15px, 1.5vw, 17px)',
                color: 'rgba(255,255,255,0.84)',
                lineHeight: 1.78,
                margin: 0,
                maxWidth: 570,
                fontWeight: 400,
              }}
            >
              SeribuAsa menghubungkan donatur dengan keluarga rentan melalui sistem e-voucher
              nutrisi, memastikan setiap bantuan tepat sasaran untuk pangan bergizi.
            </p>
          </div>

          {/* CTA sejajar dengan deskripsi */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 14,
              marginTop: 58,
            }}
          >
            <Link
              to="/donasi"
              className="hero-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 22px',
                minHeight: 46,
                borderRadius: 10,
                fontSize: 14.5,
                fontWeight: 700,
                color: '#ffffff',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #166534, #15803d)',
                border: '1px solid rgba(187, 247, 208, 0.24)',
                boxShadow: '0 10px 26px rgba(0,0,0,0.22)',
              }}
            >
              Mulai Donasi
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/register?role=beneficiary"
              className="hero-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 20px',
                minHeight: 46,
                borderRadius: 10,
                fontSize: 14.5,
                fontWeight: 650,
                color: 'rgba(255,255,255,0.92)',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.24)',
                background: 'rgba(255,255,255,0.055)',
                backdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <Users size={17} />
              Daftar Penerima Manfaat
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}