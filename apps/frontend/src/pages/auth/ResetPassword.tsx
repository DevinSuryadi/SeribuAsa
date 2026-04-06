import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { Loader2, CheckCircle } from 'lucide-react';
import logo from '@/assets/logo.svg'

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Supabase handles token exchange automatically
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  const cardStyle = {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    padding: '36px 32px',
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#fff', padding: '0 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)',
        }} />
        <div style={{ ...cardStyle, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <CheckCircle style={{ width: 48, height: 48, color: '#16a34a', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>
            Kata Sandi Diperbarui!
          </div>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
            Anda akan diarahkan ke halaman masuk...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#fff', padding: '0 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)',
      }} />
      <div style={{
        position: 'absolute', top: -60, left: -100, pointerEvents: 'none',
        width: 400, height: 400, borderRadius: '50%',
        background: 'rgba(34,197,94,0.06)', filter: 'blur(80px)',
      }} />

      <div style={{ ...cardStyle, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="flex flex-col items-center mb-8">
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              width: 100, 
              height: 100, 
              objectFit: 'contain',
              marginTop: -10,
            }} 
          />
          <h1 
            className="text-xl font-bold" 
            style={{ 
              marginTop: -20,
              color: "#346A43"
            }}
          >
            SeribuAsa
          </h1>
        </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>
            Reset Kata Sandi
          </div>
          <p style={{ marginTop: 4, fontSize: 13, color: '#888' }}>
            Masukkan kata sandi baru Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#555', display: 'block', marginBottom: 6 }}>
              Kata Sandi Baru
            </label>
            <input
              id="password"
              type="password"
              placeholder="Min. 6 karakter"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', height: 42, padding: '0 12px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, color: '#111',
                outline: 'none', boxSizing: 'border-box', background: '#fafafa',
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

          {error && (
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 9, border: 'none',
              fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(0,0,0,0.06)' : '#16a34a',
              color: loading ? '#bbb' : 'white',
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
            {loading && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
            Perbarui Kata Sandi
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;