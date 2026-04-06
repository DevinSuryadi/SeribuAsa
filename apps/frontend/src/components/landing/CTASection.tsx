import { Link } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { ArrowRight, Store, BarChart3 } from 'lucide-react';

export function CTASection() {
  const ref = useScrollReveal({ y: 30 });

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
        <div
          ref={ref}
          style={{
            maxWidth: 896,
            margin: '0 auto',
            borderRadius: 20,
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#fff',
            padding: 'clamp(32px, 6vw, 64px) clamp(20px, 5vw, 40px)',
            textAlign: 'center',
            boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 36px)',
              fontWeight: 700,
              color: '#111',
              letterSpacing: '-0.5px',
              margin: 0,
            }}
          >
            Bergabunglah dalam Misi Nutrisi Indonesia
          </h2>
          <p
            style={{
              maxWidth: 480,
              margin: '16px auto 0',
              fontSize: 15,
              color: '#666',
              lineHeight: 1.6,
            }}
          >
            Jadilah bagian dari ekosistem yang memastikan setiap keluarga mendapat akses pangan bergizi.
          </p>

          <div
            style={{
              marginTop: 36,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              flexDirection: 'column',
            }}
            className="sm:flex-row"
          >
            {/* Primary */}
            <Link
              to="/daftar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 22px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 2px 12px rgba(34,197,94,0.3)',
                transition: 'all 0.2s ease',
                width: 'clamp(200px, 100%, 300px)',
                justifyContent: 'center',
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

            {/* Outline */}
            <Link
              to="/daftar?role=vendor"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 22px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                color: '#333',
                textDecoration: 'none',
                border: '1px solid rgba(0,0,0,0.15)',
                background: 'transparent',
                transition: 'all 0.15s ease',
                width: 'clamp(200px, 100%, 300px)',
                justifyContent: 'center',
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
              <Store size={16} />
              Daftar Vendor
            </Link>

            {/* Ghost */}
            <Link
              to="/dampak"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 22px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 500,
                color: '#555',
                textDecoration: 'none',
                background: 'transparent',
                transition: 'all 0.15s ease',
                width: 'clamp(200px, 100%, 300px)',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#111';
                e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#555';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <BarChart3 size={16} />
              Lihat Dampak
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}