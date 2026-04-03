import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Paket Donasi', href: '/donasi' },
  { label: 'Tentang Kami', href: '/tentang' },
  { label: 'Dampak', href: '/dampak' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 90,
          padding: '0 24px',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(34,197,94,0.35)',
            }}
          >
            <Leaf style={{ width: 20, height: 17, color: 'white' }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 600, color: '#111', letterSpacing: '-0.3px' }}>
            SeribuAsa
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 20 }}>
          {navLinks.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#16a34a' : '#555',
                  textDecoration: 'none',
                  background: active ? 'rgba(34,197,94,0.09)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = '#111';
                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = '#555';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <Link
                to="/dashboard"
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#16a34a',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'color 0.15s ease',
                }}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <span style={{ fontSize: 14, color: '#666', padding: '0 8px' }}>
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#ef4444',
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <LogOut size={16} />
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link
                to="/masuk"
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#444',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#111')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#444')}
              >
                Masuk
              </Link>

              <Link
                to="/register"
                style={{
                  padding: '8px 18px',
                  borderRadius: 9,
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'white',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  boxShadow: '0 2px 10px rgba(34,197,94,0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(34,197,94,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(34,197,94,0.3)';
                }}
              >
                Mulai Donasi 
              </Link>
            </>
          )}
        </div>

      </div>

      {/* Mobile menu */}
      <div
        className="md:hidden"
        style={{
          overflow: 'hidden',
          maxHeight: open ? 400 : 0,
          transition: 'max-height 0.3s ease',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          borderTop: open ? '1px solid rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: 4 }}>
          {navLinks.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#16a34a' : '#333',
                  textDecoration: 'none',
                  background: active ? 'rgba(34,197,94,0.08)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 8,
              paddingTop: 12,
              borderTop: '1px solid rgba(0,0,0,0.07)',
            }}
          >
            <Link
              to="/masuk"
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 500,
                color: '#444',
                textDecoration: 'none',
                textAlign: 'center',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              Masuk
            </Link>

            <Link
              to="/register"
              style={{
                padding: '11px 14px',
                borderRadius: 9,
                fontSize: 16,
                fontWeight: 600,
                color: 'white',
                textDecoration: 'none',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 2px 10px rgba(34,197,94,0.25)',
              }}
            >
              Mulai Donasi
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}