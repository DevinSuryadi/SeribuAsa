import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Check, ArrowRight, Baby, Heart, Building2, CreditCard, QrCode, Landmark, Wallet, User } from 'lucide-react';
import { formatIDR } from '@/lib/format';
import { toast } from 'sonner';

const plans = [
  { id: 'balita', name: 'Adopsi Nutrisi 1 Balita', price: 300000, icon: Baby, features: ['Voucher pangan bergizi bulanan', 'Laporan dampak per anak', 'Sertifikat donasi digital', 'Pemantauan gizi anak'] },
  { id: '1000hpk', name: 'Paket 1000 HPK', price: 500000, icon: Heart, features: ['Semua fitur Adopsi Nutrisi', 'Dukungan nutrisi ibu hamil', 'Pemantauan pertumbuhan 1000 HPK', 'Rekomendasi nutrisi AI', 'Laporan dampak mendalam'] },
  { id: 'corporate', name: 'Corporate Impact Plan', price: 0, icon: Building2, features: ['Semua fitur Paket 1000 HPK', 'Dashboard CSR khusus', 'Laporan dampak untuk stakeholder', 'Employee matching program'] },
];

const paymentMethods = [
  { id: 'qris', label: 'QRIS', icon: QrCode },
  { id: 'va_bca', label: 'VA BCA', icon: Landmark },
  { id: 'va_mandiri', label: 'VA Mandiri', icon: Landmark },
  { id: 'gopay', label: 'GoPay', icon: Wallet },
  { id: 'cc', label: 'Kartu Kredit', icon: CreditCard },
];

export default function DonationCheckout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'balita';
  const initialType = searchParams.get('type') || 'monthly';
  const initialAmount = searchParams.get('amount');

  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [donationType, setDonationType] = useState<'monthly' | 'once'>(initialType === 'once' ? 'once' : 'monthly');
  const [customAmount, setCustomAmount] = useState(initialAmount || '');
  const [selectedPayment, setSelectedPayment] = useState('qris');
  const [agree, setAgree] = useState(false);

  const plan = plans.find((p) => p.id === selectedPlan) || plans[0];
  const isCorporate = selectedPlan === 'corporate';
  const amount = customAmount ? parseInt(customAmount) : plan.price;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/masuk?from=checkout');
    }
  }, [user, authLoading, navigate]);

  const handleProceed = () => {
    if (isCorporate) { toast.info('Untuk corporate, silakan hubungi tim kami'); return; }
    if (!agree) { toast.error('Setujui syarat dan ketentuan'); return; }

    // Save checkout data for CreateDonation
    sessionStorage.setItem('donation_checkout_data', JSON.stringify({
      plan: selectedPlan,
      type: donationType,
      amount,
      payment: selectedPayment,
      name: user?.fullName || '',
      email: user?.email || '',
    }));

    navigate(`/donation/create?plan=${selectedPlan}&type=${donationType}&amount=${amount}&payment=${selectedPayment}`);
  };

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (isCorporate) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Navbar />
        <main style={{ paddingTop: 160, paddingBottom: 80, maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', padding: 40, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 16, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Building2 style={{ width: 36, height: 36, color: '#16a34a' }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 12px' }}>Corporate Impact Plan</h1>
            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, margin: '0 0 24px' }}>Program CSR terukur untuk perusahaan Anda. Dapatkan dashboard khusus, laporan dampak untuk stakeholder, dan employee matching program.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="mailto:partnerships@seribuasa.id" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, color: 'white', textDecoration: 'none', background: '#16a34a', boxShadow: '0 2px 10px rgba(22,163,74,0.3)' }}>
                Hubungi Tim Kami <ArrowRight size={16} />
              </a>
              <button
                onClick={() => navigate('/donasi')}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 500, color: '#666', textDecoration: 'none', background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer' }}
              >
                Lihat Paket Donasi Lainnya
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar />
      <main style={{ paddingTop: 160, paddingBottom: 80, maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Left: Plan Selection */}
          <div style={{ height: 'fit-content', position: 'sticky', top: 120 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 16 }}>Pilih Paket Donasi</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: selectedPlan === p.id ? '2px solid #16a34a' : '1px solid rgba(0,0,0,0.08)',
                    background: selectedPlan === p.id ? 'rgba(34,197,94,0.04)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <p.icon style={{ width: 20, height: 20, color: selectedPlan === p.id ? '#16a34a' : '#999' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{p.price > 0 ? formatIDR(p.price) + '/bulan' : 'Custom'}</div>
                  </div>
                  {selectedPlan === p.id && <Check style={{ width: 18, height: 18, color: '#16a34a', flexShrink: 0 }} />}
                </button>
              ))}
            </div>

            {/* Plan Summary */}
            {plan.price > 0 && (
              <div style={{ marginTop: 20, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <plan.icon style={{ width: 18, height: 18, color: '#16a34a' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{donationType === 'monthly' ? 'Donasi Bulanan' : 'Donasi Sekali'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 14 }}>
                  {formatIDR(amount)}
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#aaa', marginLeft: 4 }}>{donationType === 'monthly' ? '/bulan' : ''}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#666' }}>
                      <Check style={{ width: 12, height: 12, color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Checkout Form */}
          <div style={{ borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', padding: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 24px' }}>Detail Donasi</h2>

            {/* Logged-in User Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, background: '#f9fafb', marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User style={{ width: 20, height: 20, color: '#16a34a' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{user.fullName}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{user.email}</div>
              </div>
            </div>

            {/* Frequency Toggle */}
            {plan.price > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 8 }}>Frekuensi Donasi</label>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 4, borderRadius: 999, border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(255,255,255,0.8)' }}>
                  {['Bulanan', 'Sekali Donasi'].map((label) => {
                    const active = label === 'Bulanan' ? donationType === 'monthly' : donationType === 'once';
                    return (
                      <button key={label} onClick={() => setDonationType(label === 'Bulanan' ? 'monthly' : 'once')} style={{ padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.15s ease', background: active ? '#16a34a' : 'transparent', color: active ? 'white' : '#666' }}>{label}</button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Amount */}
            {plan.price > 0 && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Jumlah Custom (opsional)</label>
                <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder={`Default: ${formatIDR(plan.price)}`} style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#16a34a')} onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
              </div>
            )}

            {/* Payment Method */}
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 16px' }}>Metode Pembayaran</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {paymentMethods.map((pm) => (
                <button key={pm.id} onClick={() => setSelectedPayment(pm.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: selectedPayment === pm.id ? '1.5px solid #16a34a' : '1px solid rgba(0,0,0,0.08)', background: selectedPayment === pm.id ? 'rgba(34,197,94,0.04)' : '#fff', cursor: 'pointer', transition: 'all 0.15s ease', width: '100%', textAlign: 'left' }}>
                  <pm.icon style={{ width: 18, height: 18, color: selectedPayment === pm.id ? '#16a34a' : '#999' }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: selectedPayment === pm.id ? '#111' : '#666' }}>{pm.label}</span>
                  {selectedPayment === pm.id && <Check style={{ width: 16, height: 16, color: '#16a34a', marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>

            {/* Agreement */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer', fontSize: 13, color: '#666', lineHeight: 1.5 }}>
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2, accentColor: '#16a34a' }} />
              Saya menyetujui <span style={{ color: '#16a34a', textDecoration: 'underline' }}>Syarat & Ketentuan</span> serta memahami bahwa donasi ini bersifat sukarela.
            </label>

            {/* Total + CTA */}
            <div style={{ padding: 16, borderRadius: 10, background: '#f9fafb', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#666' }}>Total Donasi</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{formatIDR(amount)}</span>
              </div>
            </div>

            <button onClick={handleProceed} style={{ width: '100%', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 600, color: 'white', background: '#16a34a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 10px rgba(22,163,74,0.3)' }}>
              Lanjut ke Pembayaran <ArrowRight size={16} />
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 12 }}>Setelah klik tombol, Anda akan diarahkan ke halaman konfirmasi pembayaran.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
