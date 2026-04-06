import { useState, useEffect, useRef, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, ChevronDown, User, X, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.svg';

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Paket Donasi', href: '/donasi' },
  { label: 'Tentang Kami', href: '/tentang' },
  { label: 'Dampak', href: '/dampak' },
];

const roleLabels: Record<string, string> = {
  donor: 'Donatur',
  beneficiary: 'Penerima',
  vendor: 'Vendor',
  admin: 'Admin',
  government: 'Pemerintah',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Navbar() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 1024 : false);
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 1024;
      setIsMobile(newIsMobile);
      if (!newIsMobile && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  return (
    <>
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 'clamp(64px, 10vh, 80px)',
          padding: '0 clamp(12px, 4vw, 24px)',
        }}
      >
        <Link 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none',
            marginLeft: '-10px' 
          }}
        >
          <div
            style={{
              width: 90, 
              height: 90,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: -18, // Mendekatkan logo ke tulisan
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img 
              src={logo} 
              alt="Logo SeribuAsa" 
              style={{ 
                width: '110%', 
                height: '110%', 
                objectFit: 'contain' 
              }} 
            />
          </div>
          <span 
            style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: '#346A43', 
              letterSpacing: '-0.8px',
              position: 'relative',
              zIndex: 1
            }}
          >
            SeribuAsa
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex" style={{ alignItems: 'center', gap: 4 }}>
          {navLinks.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#15803d' : '#666',
                  textDecoration: 'none',
                  background: active ? 'rgba(21,128,61,0.08)' : 'transparent',
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
                    e.currentTarget.style.color = '#666';
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
        <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              {/* User Menu */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 8px 4px 4px',
                    borderRadius: 999,
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #22c55e, #15803d)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {user.fullName ? getInitials(user.fullName) : <User size={14} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#333', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.fullName || user.email}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: '#999',
                      transition: 'transform 0.2s ease',
                      transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      minWidth: 200,
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: '#fff',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      overflow: 'hidden',
                      zIndex: 60,
                    }}
                  >
                    {/* User Info */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{user.fullName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: '#999' }}>{user.email}</span>
                        {userRole && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#15803d',
                            background: 'rgba(21,128,61,0.08)',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}>
                            {roleLabels[userRole] || userRole}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div style={{ padding: '4px 0' }}>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 16px',
                          fontSize: 13,
                          color: '#333',
                          textDecoration: 'none',
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LayoutDashboard size={15} style={{ color: '#999' }} />
                        Dashboard
                      </Link>
                      <Link
                        to="/dashboard/profile"
                        onClick={() => setUserMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 16px',
                          fontSize: 13,
                          color: '#333',
                          textDecoration: 'none',
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <User size={15} style={{ color: '#999' }} />
                        Profil Saya
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '4px 0' }}>
                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '8px 16px',
                          fontSize: 13,
                          color: '#ef4444',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.04)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut size={15} style={{ color: '#ef4444' }} />
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/masuk"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#555',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#111')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
              >
                Masuk
              </Link>

              <Link
                to="/register"
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'white',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #22c55e, #15803d)',
                  boxShadow: '0 2px 8px rgba(21,128,61,0.25)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(21,128,61,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(21,128,61,0.25)';
                }}
              >
                Mulai Donasi
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        {isMobile && (
          <button
            data-mobile-trigger="true"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#333',
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>
    </header>

      {/* Mobile menu */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#fff',
            borderTop: '1px solid rgba(0,0,0,0.06)',
            zIndex: 40,
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '12px 0' }}>
            {navLinks.map((link) => {
              const active = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? '#15803d' : '#666',
                    textDecoration: 'none',
                    borderLeft: active ? '3px solid #15803d' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />

            {/* User menu mobile */}
            {user ? (
              <>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#666',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LayoutDashboard size={18} />
                    Dashboard
                  </div>
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#dc2626',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LogOut size={18} />
                    Keluar
                  </div>
                </button>
              </>
            ) : (
              <div style={{ padding: '8px 12px', display: 'flex', gap: 8, flexDirection: 'column' }}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#666',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    background: 'linear-gradient(135deg, #22c55e, #15803d)',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default memo(Navbar);
