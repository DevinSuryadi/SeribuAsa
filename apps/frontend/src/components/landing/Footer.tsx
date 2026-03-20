import { Link } from 'react-router-dom';

const footerLinks = [
  {
    title: 'Platform',
    links: [
      { label: 'Paket Donasi', href: '/donasi' },
      { label: 'Daftar Penerima', href: '/daftar?role=beneficiary' },
      { label: 'Mitra Vendor', href: '/daftar?role=vendor' },
    ],
  },
  {
    title: 'Perusahaan',
    links: [
      { label: 'Tentang Kami', href: '/tentang' },
      { label: 'Dampak', href: '/dampak' },
      { label: 'Kontak', href: '/kontak' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Kebijakan Privasi', href: '/privasi' },
      { label: 'Syarat & Ketentuan', href: '/syarat' },
    ],
  },
];

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(0,0,0,0.08)',
        background: '#fafafa',
        padding: '48px 0 32px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 32,
          }}
        >
          {/* Brand */}
          <div>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 600, color: '#111' }}>SeribuAsa</span>
            </Link>
            <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, maxWidth: 200, margin: 0 }}>
              Ekosistem digital untuk ketahanan pangan dan nutrisi Indonesia.
            </p>
          </div>

          {/* Link groups */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#333', margin: '0 0 12px' }}>
                {group.title}
              </h4>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      style={{ fontSize: 13, color: '#888', textDecoration: 'none', transition: 'color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#111')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: '1px solid rgba(0,0,0,0.07)',
            textAlign: 'center',
            fontSize: 12,
            color: '#aaa',
          }}
        >
          © {new Date().getFullYear()} SeribuAsa. Hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}