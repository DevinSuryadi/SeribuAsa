import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { Leaf, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const LupaSandi = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Gagal mengirim', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '0 24px',
        background: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)',
        }} />

        <div style={{
          width: '100%', maxWidth: 400, textAlign: 'center',
          borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
          padding: '40px 32px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <CheckCircle style={{ width: 26, height: 26, color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>
            Email Terkirim!
          </div>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, margin: '0 0 28px' }}>
            Silakan cek inbox email <strong style={{ color: '#555' }}>{email}</strong> untuk tautan reset kata sandi.
          </p>
          <Link
            to="/masuk"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 14, fontWeight: 500, color: '#555',
              textDecoration: 'none', transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
          >
            <ArrowLeft size={14} /> Kembali ke Masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '0 24px',
      background: '#fff', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)',
      }} />
      <div style={{
        position: 'absolute', top: -60, left: -100, pointerEvents: 'none',
        width: 500, height: 500, borderRadius: '50%',
        background: 'rgba(34,197,94,0.06)', filter: 'blur(90px)',
      }} />

      <div style={{
        width: '100%', maxWidth: 400,
        borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
        padding: '40px 32px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          textDecoration: 'none', justifyContent: 'center', marginBottom: 28,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
          }}>
            <Leaf style={{ width: 17, height: 17, color: 'white' }} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
            SeribuAsa
          </span>
        </Link>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6 }}>
            Lupa Kata Sandi
          </div>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
            Masukkan email Anda untuk menerima tautan reset
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              fontSize: 13, fontWeight: 500, color: '#555',
              display: 'block', marginBottom: 6,
            }}>
              Email
            </label>
            <input
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', height: 42, padding: '0 12px',
                borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)',
                fontSize: 14, color: '#111', outline: 'none',
                boxSizing: 'border-box', background: '#fafafa',
                transition: 'all 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#16a34a';
                e.currentTarget.style.background = 'white';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)';
                e.currentTarget.style.background = '#fafafa';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px', borderRadius: 9,
              border: 'none', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(0,0,0,0.06)' : '#16a34a',
              color: loading ? '#bbb' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s ease',
              boxShadow: loading ? 'none' : '0 2px 10px rgba(22,163,74,0.2)',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#15803d';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#16a34a';
            }}
          >
            {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
            Kirim Tautan Reset
          </button>

          <Link
            to="/masuk"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 13, fontWeight: 500, color: '#888',
              textDecoration: 'none', transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
          >
            <ArrowLeft size={13} /> Kembali ke Masuk
          </Link>
        </form>
      </div>
    </div>
  );
};

export default LupaSandi;