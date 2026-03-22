import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCountUp } from '../hooks/useCountUp';
import { useStaggerChildren } from '../hooks/useStaggerChildren';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { MapPin, TrendingUp, Users, Wheat, Baby, Download } from 'lucide-react';

const regionData = [
  { provinsi: 'Jawa Barat', penerima: 3200, voucher: 9600, penukaran: 89 },
  { provinsi: 'Jawa Timur', penerima: 2800, voucher: 8400, penukaran: 91 },
  { provinsi: 'Jawa Tengah', penerima: 2100, voucher: 6300, penukaran: 85 },
  { provinsi: 'NTT', penerima: 1800, voucher: 5400, penukaran: 78 },
  { provinsi: 'NTB', penerima: 1200, voucher: 3600, penukaran: 82 },
  { provinsi: 'Sulawesi Selatan', penerima: 900, voucher: 2700, penukaran: 88 },
];

const fiesTrend = [
  { bulan: 'Jul', rendah: 45, sedang: 35, parah: 20 },
  { bulan: 'Agu', rendah: 48, sedang: 34, parah: 18 },
  { bulan: 'Sep', rendah: 52, sedang: 32, parah: 16 },
  { bulan: 'Okt', rendah: 55, sedang: 31, parah: 14 },
  { bulan: 'Nov', rendah: 58, sedang: 30, parah: 12 },
  { bulan: 'Des', rendah: 62, sedang: 28, parah: 10 },
];

const nutritionPie = [
  { name: 'Normal', value: 65, color: '#16a34a' },
  { name: 'Waspada', value: 25, color: '#eab308' },
  { name: 'Kritis', value: 10, color: '#ef4444' },
];

const categoryUsage = [
  { kategori: 'Telur', persen: 28 },
  { kategori: 'Sayuran', persen: 22 },
  { kategori: 'Susu', persen: 18 },
  { kategori: 'Daging', persen: 14 },
  { kategori: 'Buah', persen: 10 },
  { kategori: 'Kacang', persen: 8 },
];

function StatCounter({ end, prefix = '', suffix = '', label }: { end: number; prefix?: string; suffix?: string; label: string }) {
  const { ref, display } = useCountUp({ end, prefix, suffix, separator: '.' });
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        style={{ fontSize: 'clamp(22px, 2.5vw, 28px)', fontWeight: 800, color: '#16a34a', letterSpacing: '-0.5px', lineHeight: 1 }}
      >
        {display}
      </div>
      <div style={{ marginTop: 5, fontSize: 12, color: '#aaa', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

const cardStyle = {
  borderRadius: 14,
  border: '1px solid rgba(0,0,0,0.07)',
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(12px)',
  padding: '24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const sectionTitleStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 20,
};

const Dampak = () => {
  const titleRef = useScrollReveal({ y: 30 });
  const chartsRef = useStaggerChildren({ stagger: 0.1 });

  return (
    <div style={{ minHeight: '100vh', background: '#fff', position: 'relative', overflow: 'hidden' }}>

      <Navbar />
      <main style={{ paddingTop: 120, paddingBottom: 80, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 70% 40% at 50% 0%, rgba(34,197,94,0.09) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 10% 50%, rgba(34,197,94,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 90% 60%, rgba(74,222,128,0.06) 0%, transparent 55%),
            radial-gradient(ellipse 60% 30% at 50% 95%, rgba(34,197,94,0.05) 0%, transparent 55%)
          `,
        }} />
        <div style={{
          position: 'absolute', top: -60, left: -100, zIndex: 0, pointerEvents: 'none',
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(34,197,94,0.07)', filter: 'blur(90px)',
        }} />
        <div style={{
          position: 'absolute', top: '35%', right: -80, zIndex: 0, pointerEvents: 'none',
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(74,222,128,0.06)', filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', left: '15%', zIndex: 0, pointerEvents: 'none',
          width: 380, height: 380, borderRadius: '50%',
          background: 'rgba(34,197,94,0.06)', filter: 'blur(90px)',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div ref={titleRef} style={{ textAlign: 'center', marginBottom: 60 }}>
            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800,
              color: '#111', letterSpacing: '-1px', margin: 0,
            }}>
              Dampak Nyata <span style={{ color: '#16a34a' }}>SeribuAsa</span>
            </h1>
          </div>

          {/* KPI */}
          <div style={{
            ...cardStyle,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            marginBottom: 32,
            padding: 0,
            overflow: 'hidden',
          }}>
            {[
              { end: 12500, suffix: '+', label: 'Penerima Manfaat Aktif' },
              { end: 45000, suffix: '+', label: 'Voucher Tersalurkan' },
              { end: 4200, prefix: 'Rp', suffix: 'Jt', label: 'Dana Tersalurkan' },
              { end: 87, suffix: '%', label: 'Tingkat Penukaran' },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: '24px 16px',
                borderRight: i < 3 ? '1px solid rgba(0,0,0,0.07)' : 'none',
              }}>
                <StatCounter {...s} />
              </div>
            ))}
          </div>

          <div ref={chartsRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Regional bar chart */}
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>
                <MapPin size={16} color="#16a34a" /> Dampak per Wilayah
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="provinsi" tick={{ fill: '#aaa', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#aaa', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="penerima" fill="#16a34a" radius={[4, 4, 0, 0]} name="Penerima" />
                  <Bar dataKey="voucher" fill="#4ade80" radius={[4, 4, 0, 0]} name="Voucher" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* FIES + Pie */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={cardStyle}>
                <div style={sectionTitleStyle}>
                  <TrendingUp size={16} color="#16a34a" /> Tren Ketahanan Pangan (FIES)
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={fiesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="bulan" tick={{ fill: '#aaa', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#aaa', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 13 }} />
                    <Legend />
                    <Line type="monotone" dataKey="rendah" stroke="#16a34a" name="Rendah" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sedang" stroke="#eab308" name="Sedang" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="parah" stroke="#ef4444" name="Parah" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={cardStyle}>
                <div style={sectionTitleStyle}>
                  <Baby size={16} color="#16a34a" /> Status Gizi Balita
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={nutritionPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }: { name: string; value: number }) => `${name}: ${value}%`} labelLine={false}>
                      {nutritionPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category usage */}
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>
                <Wheat size={16} color="#16a34a" /> Penggunaan Voucher per Kategori Pangan
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {categoryUsage.map((cat) => (
                  <div key={cat.kategori} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 72, fontSize: 13, color: '#888' }}>{cat.kategori}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 999, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: '#16a34a', width: `${cat.persen}%`, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ width: 36, textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#333' }}>{cat.persen}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={sectionTitleStyle}>
                  <Users size={16} color="#16a34a" /> Detail per Provinsi
                </div>
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.1)', background: 'transparent',
                  fontSize: 13, fontWeight: 500, color: '#555', cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#16a34a';
                  e.currentTarget.style.color = '#16a34a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                  e.currentTarget.style.color = '#555';
                }}>
                  <Download size={13} /> Unduh CSV
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Provinsi', 'Penerima', 'Voucher', 'Penukaran'].map((h, i) => (
                        <th key={h} style={{
                          padding: '10px 0', fontWeight: 600, color: '#aaa',
                          textAlign: i === 0 ? 'left' : 'right',
                          borderBottom: '1px solid rgba(0,0,0,0.07)',
                          fontSize: 12, letterSpacing: '0.03em',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {regionData.map((r) => (
                      <tr key={r.provinsi}>
                        <td style={{ padding: '12px 0', fontWeight: 600, color: '#111', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{r.provinsi}</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: '#666', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{r.penerima.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: '#666', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>{r.voucher.toLocaleString('id-ID')}</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                            fontSize: 12, fontWeight: 600,
                            background: r.penukaran >= 85 ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.05)',
                            color: r.penukaran >= 85 ? '#16a34a' : '#888',
                          }}>
                            {r.penukaran}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dampak;