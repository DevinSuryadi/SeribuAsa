import { useState } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Mail, Phone, MapPin, ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'Apa itu e-voucher SeribuAsa?', a: 'E-voucher SeribuAsa adalah saldo digital terbatas yang hanya bisa digunakan untuk membeli bahan pangan bergizi seperti telur, susu, sayuran, buah, dan daging dari mitra vendor terverifikasi.' },
  { q: 'Bagaimana proses verifikasi penerima manfaat?', a: 'Calon penerima mendaftar dengan NIK dan data keluarga. Tim kami memverifikasi kelayakan berdasarkan data DTKS, profil rumah tangga, dan skor FIES (Food Insecurity Experience Scale).' },
  { q: 'Apa itu FIES dan mengapa penting?', a: 'FIES (Food Insecurity Experience Scale) adalah survei 8 pertanyaan standar internasional untuk mengukur tingkat kerawanan pangan. Hasilnya menentukan prioritas bantuan.' },
  { q: 'Bagaimana data pribadi saya dilindungi?', a: 'Kami menerapkan enkripsi data, row-level security, dan masking data sensitif. NIK dan informasi pribadi tidak pernah dibagikan kepada pihak ketiga.' },
  { q: 'Bisakah saya melihat ke mana donasi saya disalurkan?', a: 'Ya! Setiap donatur mendapat dashboard dampak yang menunjukkan alokasi dana, jumlah penerima, dan indikator nutrisi secara transparan.' },
  { q: 'Makanan apa saja yang bisa dibeli dengan voucher?', a: 'Hanya bahan pangan mentah bergizi: telur, susu, sayuran, buah-buahan, daging, ikan, kacang-kacangan, dan biji-bijian. Makanan olahan dan junk food tidak diperbolehkan.' },
];

const values = [
  {title: 'Misi', desc: 'Menghapus kerawanan pangan melalui distribusi bantuan nutrisi yang tepat sasaran, terukur, dan transparan.' },
  {title: 'Visi', desc: 'Indonesia di mana setiap anak, ibu hamil, dan keluarga rentan terjamin akses pangannya.' },
  {title: 'Nilai', desc: 'Transparansi, keadilan distribusi, berbasis data, dan keberlanjutan dampak.' },
];

const Tentang = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', msg: '' });
  const filled = form.name && form.email && form.msg;

  const heroRef = useScrollReveal({ y: 30 });
  const missionRef = useScrollReveal({ y: 30 });
  const faqRef = useScrollReveal({ y: 30 });
  const contactRef = useScrollReveal({ y: 30 });

  return (
    <div style={{ minHeight: '100vh', background: '#fff', position: 'relative', overflow: 'hidden' }}>

      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)',
      }} />
      <div style={{
        position: 'absolute', top: -60, left: -100, zIndex: 0, pointerEvents: 'none',
        width: 500, height: 500, borderRadius: '50%',
        background: 'rgba(34,197,94,0.06)', filter: 'blur(90px)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, right: -80, zIndex: 0, pointerEvents: 'none',
        width: 420, height: 420, borderRadius: '50%',
        background: 'rgba(74,222,128,0.06)', filter: 'blur(80px)',
      }} />

      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 80, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

          {/* Hero */}
          <div ref={heroRef} style={{ textAlign: 'center', marginBottom: 72 }}>
            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, color: '#111',
              letterSpacing: '-1.5px', margin: 0,
            }}>
              Tentang <span style={{ color: '#16a34a' }}>SeribuAsa</span>
            </h1>
            <p style={{
              marginTop: 16, fontSize: 16, color: '#888',
              maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.75,
            }}>
              Platform digital yang memastikan setiap keluarga Indonesia mendapat
              akses pangan bergizi yang layak dan terukur.
            </p>
          </div>

          {/* Values */}
          <div
            ref={missionRef}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 30, maxWidth: 900, margin: '0 auto 80px',
            }}
          >
            {values.map((item) => (
              <div
                key={item.title}
                style={{
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  padding: '28px 24px',
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
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#16a34a',
                  letterSpacing: '0.1em', marginBottom: 12,
                }}>
                </div>
                <div style={{ fontSize: 25, fontWeight: 700, color: '#007800', marginBottom: 8 }}>
                  {item.title}
                </div>
                <p style={{ fontSize: 14, color: '#888', lineHeight: 1.65, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div ref={faqRef} style={{ maxWidth: 680, margin: '0 auto 80px' }}>
            <h2 style={{
              fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, color: '#111',
              textAlign: 'center', letterSpacing: '-0.5px', margin: '0 0 32px',
            }}>
              Pertanyaan Umum
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {faqs.map((faq, i) => {
                const key = `item-${i}`;
                const isOpen = openFaq === key;
                return (
                  <div
                    key={key}
                    style={{
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(8px)',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : key)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: 12,
                        padding: '16px 20px', background: 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111', lineHeight: 1.5 }}>
                        {faq.q}
                      </span>
                      <ChevronDown
                        size={16}
                        style={{
                          color: '#16a34a', flexShrink: 0,
                          transition: 'transform 0.2s ease',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </button>
                    <div style={{
                      maxHeight: isOpen ? 300 : 0,
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease',
                    }}>
                      <div style={{
                        padding: '14px 20px 16px',
                        borderTop: '1px solid rgba(0,0,0,0.06)',
                        fontSize: 13, color: '#777', lineHeight: 1.7,
                      }}>
                        {faq.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div ref={contactRef} style={{ maxWidth: 780, margin: '0 auto' }}>
            <h2 style={{
              fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, color: '#111',
              textAlign: 'center', letterSpacing: '-0.5px', margin: '0 0 32px',
            }}>
              Hubungi Kami
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32 }}>
              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { icon: Mail, label: 'Email', value: 'info@seribuasa.id' },
                  { icon: Phone, label: 'Telepon', value: '(021) 1234-5678' },
                  { icon: MapPin, label: 'Alamat', value: 'Jl. Sudirman No. 123, Jakarta Pusat 10110' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(34,197,94,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <item.icon style={{ width: 16, height: 16, color: '#16a34a' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#999', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 14, color: '#333' }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form */}
              <div style={{
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                padding: 24,
                display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                {[
                  { id: 'name', label: 'Nama', type: 'text', placeholder: 'Nama lengkap' },
                  { id: 'email', label: 'Email', type: 'email', placeholder: 'email@contoh.com' },
                ].map((field) => (
                  <div key={field.id}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.id as 'name' | 'email']}
                      onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                      style={{
                        width: '100%', height: 40, padding: '0 12px', borderRadius: 6,
                        border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, color: '#111',
                        outline: 'none', boxSizing: 'border-box', background: 'white',
                        transition: 'border-color 0.15s ease',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#16a34a')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                    />
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
                    Pesan
                  </label>
                  <textarea
                    placeholder="Tulis pesan Anda..."
                    rows={4}
                    value={form.msg}
                    onChange={(e) => setForm({ ...form, msg: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 6,
                      border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, color: '#111',
                      outline: 'none', boxSizing: 'border-box', background: 'white',
                      resize: 'vertical', fontFamily: 'inherit',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#16a34a')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                  />
                </div>

                <button
                  disabled={!filled}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                    fontSize: 14, fontWeight: 600,
                    cursor: filled ? 'pointer' : 'not-allowed',
                    background: filled ? '#16a34a' : 'rgba(0,0,0,0.06)',
                    color: filled ? 'white' : '#bbb',
                    transition: 'all 0.15s ease',
                    boxShadow: filled ? '0 2px 10px rgba(22,163,74,0.2)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (filled) {
                      e.currentTarget.style.background = '#15803d';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filled) {
                      e.currentTarget.style.background = '#16a34a';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  Kirim Pesan
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tentang;