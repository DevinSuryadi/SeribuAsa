import { useState } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function Kontak() {
  const [form, setForm] = useState({ name: '', email: '', msg: '' });
  const filled = form.name && form.email && form.msg;
  const heroRef = useScrollReveal({ y: 30 });
  const contactRef = useScrollReveal({ y: 30 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Pesan terkirim! Kami akan segera menghubungi Anda.');
    setForm({ name: '', email: '', msg: '' });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)' }} />
      <div style={{ position: 'absolute', top: -60, left: -100, zIndex: 0, pointerEvents: 'none', width: 500, height: 500, borderRadius: '50%', background: 'rgba(34,197,94,0.06)', filter: 'blur(90px)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: -80, zIndex: 0, pointerEvents: 'none', width: 420, height: 420, borderRadius: '50%', background: 'rgba(74,222,128,0.06)', filter: 'blur(80px)' }} />

      <Navbar />

      <main style={{ paddingTop: 120, paddingBottom: 80, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div ref={heroRef} style={{ textAlign: 'center', marginBottom: 56 }}>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#111', letterSpacing: '-1px', margin: 0 }}>
              Hubungi <span style={{ color: '#16a34a' }}>Kami</span>
            </h1>
            <p style={{ marginTop: 16, fontSize: 16, color: '#888', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.75 }}>
              Punya pertanyaan atau ingin berkolaborasi? Kami senang mendengar dari Anda.
            </p>
          </div>

          <div ref={contactRef} style={{ maxWidth: 780, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32 }}>
              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { icon: Mail, label: 'Email', value: 'info@seribuasa.id' },
                  { icon: Phone, label: 'Telepon', value: '(021) 1234-5678' },
                  { icon: MapPin, label: 'Alamat', value: 'Jl. Sudirman No. 123, Jakarta Pusat 10110' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
              <form onSubmit={handleSubmit} style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { id: 'name', label: 'Nama', type: 'text', placeholder: 'Nama lengkap' },
                  { id: 'email', label: 'Email', type: 'email', placeholder: 'email@contoh.com' },
                ].map((field) => (
                  <div key={field.id}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>{field.label}</label>
                    <input type={field.type} placeholder={field.placeholder} value={form[field.id as 'name' | 'email']} onChange={(e) => setForm({ ...form, [field.id]: e.target.value })} required style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box', background: 'white', transition: 'border-color 0.15s ease' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#16a34a')} onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>Pesan</label>
                  <textarea placeholder="Tulis pesan Anda..." rows={4} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} required style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box', background: 'white', resize: 'vertical', fontFamily: 'inherit', transition: 'border-color 0.15s ease' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#16a34a')} onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')} />
                </div>
                <button type="submit" disabled={!filled} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: filled ? 'pointer' : 'not-allowed', background: filled ? '#16a34a' : 'rgba(0,0,0,0.06)', color: filled ? 'white' : '#bbb', transition: 'all 0.15s ease', boxShadow: filled ? '0 2px 10px rgba(22,163,74,0.2)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Send size={16} /> Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
