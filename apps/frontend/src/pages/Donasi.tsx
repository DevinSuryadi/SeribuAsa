import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useStaggerChildren } from '../hooks/useStaggerChildren';
import { Check, ArrowRight, Baby, Heart, Building2 } from 'lucide-react';
import { formatIDR } from '../lib/format';

const plans = [
  {
    id: 'balita',
    name: 'Adopsi Nutrisi 1 Balita',
    price: 300000,
    period: '/bulan',
    icon: Baby,
    popular: true,
    desc: 'Dukung nutrisi lengkap satu balita setiap bulan.',
    features: [
      'Voucher pangan bergizi bulanan',
      'Laporan dampak per anak',
      'Sertifikat donasi digital',
      'Pemantauan gizi anak',
    ],
  },
  {
    id: '1000hpk',
    name: 'Paket 1000 HPK',
    price: 500000,
    period: '/bulan',
    icon: Heart,
    popular: false,
    desc: 'Dukung ibu hamil dan bayi di 1000 Hari Pertama Kehidupan.',
    features: [
      'Semua fitur Adopsi Nutrisi',
      'Dukungan nutrisi ibu hamil',
      'Pemantauan pertumbuhan 1000 HPK',
      'Rekomendasi nutrisi AI',
      'Laporan dampak mendalam',
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate Impact Plan',
    price: 0,
    period: 'custom',
    icon: Building2,
    popular: false,
    desc: 'Program CSR terukur untuk perusahaan Anda.',
    features: [
      'Semua fitur Paket 1000 HPK',
      'Dashboard CSR khusus',
      'Laporan dampak untuk stakeholder',
      'Employee matching program',
      'Branding & kampanye kustom',
      'Account manager dedicated',
    ],
  },
];

const quickAmounts = [50000, 100000, 250000, 500000];

const Donasi = () => {
  const [isMonthly, setIsMonthly] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const titleRef = useScrollReveal({ y: 30 });
  const gridRef = useStaggerChildren({ stagger: 0.15 });

  return (
    <div style={{ minHeight: '100vh', background: '#fff', position: 'relative', overflow: 'hidden' }}>

      {/* Background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: 'radial-gradient(ellipse 100% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed',
        top: -60,
        left: -100,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'rgba(34,197,94,0.06)',
        filter: 'blur(70px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed',
        bottom: 0,
        right: -80,
        width: 420,
        height: 420,
        borderRadius: '50%',
        background: 'rgba(74,222,128,0.06)',
        filter: 'blur(70px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 80, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* Header */}
          <div ref={titleRef} style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 800,
              color: '#111',
              letterSpacing: '-1px',
              margin: 0,
            }}>
              Paket Donasi
            </h1>
            <p style={{
              marginTop: 12,
              fontSize: 15,
              color: '#888',
              maxWidth: 440,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.7,
            }}>
              Pilih cara Anda berkontribusi untuk nutrisi anak Indonesia.
            </p>

            {/* Toggle */}
            <div style={{
              marginTop: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: 4,
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.09)',
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(8px)',
            }}>
              {['Bulanan', 'Sekali Donasi'].map((label) => {
                const active = label === 'Bulanan' ? isMonthly : !isMonthly;
                return (
                  <button
                    key={label}
                    onClick={() => setIsMonthly(label === 'Bulanan')}
                    style={{
                      padding: '7px 18px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 500,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: active ? '#16a34a' : 'transparent',
                      color: active ? 'white' : '#666',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plans grid */}
          <div
            ref={gridRef}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              maxWidth: 960,
              margin: '0 auto',
            }}
          >
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 16,
                  border: plan.popular ? '1.5px solid #16a34a' : '1px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  padding: '28px 24px 24px',
                  boxShadow: plan.popular ? '0 4px 24px rgba(22,163,74,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = plan.popular
                    ? '0 8px 32px rgba(22,163,74,0.15)'
                    : '0 8px 28px rgba(0,0,0,0.09)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = plan.popular
                    ? '0 4px 24px rgba(22,163,74,0.1)'
                    : '0 1px 4px rgba(0,0,0,0.04)';
                }}
              >
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '3px 14px',
                    borderRadius: 999,
                    background: '#16a34a',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.03em',
                  }}>
                    Paling Populer
                  </div>
                )}

                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(34,197,94,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <plan.icon style={{ width: 22, height: 22, color: '#16a34a' }} />
                </div>

                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{plan.name}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: '#999', lineHeight: 1.5 }}>{plan.desc}</div>

                <div style={{ margin: '18px 0', paddingBottom: 18, borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                  {plan.price > 0 ? (
                    <>
                      <span style={{ fontSize: 28, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>
                        {formatIDR(plan.price)}
                      </span>
                      <span style={{ fontSize: 13, color: '#aaa', marginLeft: 4 }}>
                        {isMonthly ? plan.period : ''}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>Hubungi Kami</span>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#666' }}>
                      <Check style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    padding: '11px 20px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    background: plan.popular ? '#16a34a' : 'transparent',
                    color: plan.popular ? 'white' : '#444',
                    border: plan.popular ? 'none' : '1px solid rgba(0,0,0,0.12)',
                    boxShadow: plan.popular ? '0 2px 10px rgba(22,163,74,0.2)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = plan.popular ? '#15803d' : 'rgba(0,0,0,0.03)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = plan.popular ? '#16a34a' : 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {plan.price > 0 ? 'Pilih Paket' : 'Hubungi Tim'}
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            ))}
          </div>

          {/* Custom donation */}
          <div style={{
            maxWidth: 420,
            margin: '48px auto 0',
            borderRadius: 16,
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            padding: '28px 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Donasi Jumlah Lainnya</div>
              <div style={{ marginTop: 4, fontSize: 13, color: '#999' }}>Masukkan jumlah donasi sesuai keinginan Anda</div>
            </div>

            <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
              Jumlah (IDR)
            </label>
            <input
              type="number"
              placeholder="Contoh: 100000"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 9,
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: 14,
                color: '#111',
                outline: 'none',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.9)',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#16a34a')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCustomAmount(String(amt))}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    border: customAmount === String(amt) ? '1px solid #16a34a' : '1px solid rgba(0,0,0,0.1)',
                    background: customAmount === String(amt) ? 'rgba(34,197,94,0.07)' : 'transparent',
                    color: customAmount === String(amt) ? '#16a34a' : '#666',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {formatIDR(amt)}
                </button>
              ))}
            </div>

            <Link
              to="/register"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                marginTop: 16,
                padding: '12px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                cursor: customAmount ? 'pointer' : 'not-allowed',
                background: customAmount ? '#16a34a' : 'rgba(0,0,0,0.06)',
                color: customAmount ? 'white' : '#bbb',
                transition: 'all 0.15s ease',
                boxShadow: customAmount ? '0 2px 10px rgba(22,163,74,0.2)' : 'none',
              }}
            >
              Donasi Sekarang
            </Link>
          </div>
          
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Donasi;