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
    <div className="text-center">
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="text-2xl md:text-3xl font-extrabold text-green-600 leading-none tracking-tight"
      >
        {display}
      </div>
      <div className="mt-1.5 text-xs text-gray-400 font-medium">{label}</div>
    </div>
  );
}

const Dampak = () => {
  const titleRef = useScrollReveal({ y: 30 });
  const chartsRef = useStaggerChildren({ stagger: 0.1 });

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Navbar />
      <main className="pt-24 md:pt-28 pb-16 md:pb-20 relative z-10 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(34,197,94,0.09) 0%, transparent 60%)' }}
        />
        <div className="absolute -top-16 -left-24 w-96 h-96 rounded-full pointer-events-none z-0"
          style={{ background: 'rgba(34,197,94,0.07)', filter: 'blur(90px)' }}
        />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full pointer-events-none z-0"
          style={{ background: 'rgba(74,222,128,0.06)', filter: 'blur(80px)' }}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Header */}
          <div ref={titleRef} className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Dampak Nyata <span className="text-green-600">SeribuAsa</span>
            </h1>
          </div>

          {/* KPI Grid — 2 cols on mobile, 4 on md+ */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md shadow-sm mb-8 overflow-hidden">
            {[
              { end: 12500, suffix: '+', label: 'Penerima Manfaat Aktif' },
              { end: 45000, suffix: '+', label: 'Voucher Tersalurkan' },
              { end: 4200, prefix: 'Rp', suffix: 'Jt', label: 'Dana Tersalurkan' },
              { end: 87, suffix: '%', label: 'Tingkat Penukaran' },
            ].map((s) => (
              <div key={s.label} className="py-5 px-4">
                <StatCounter {...s} />
              </div>
            ))}
          </div>

          <div ref={chartsRef} className="flex flex-col gap-5">

            {/* Regional bar chart */}
            <div className="rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-5">
                <MapPin size={16} className="text-green-600" /> Dampak per Wilayah
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="provinsi" tick={{ fill: '#aaa', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#aaa', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="penerima" fill="#16a34a" radius={[4, 4, 0, 0]} name="Penerima" />
                  <Bar dataKey="voucher" fill="#4ade80" radius={[4, 4, 0, 0]} name="Voucher" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* FIES + Pie — 1 col on mobile, 2 on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                  <TrendingUp size={16} className="text-green-600" /> Tren Ketahanan Pangan (FIES)
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={fiesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="bulan" tick={{ fill: '#aaa', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#aaa', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 13 }} />
                    <Legend />
                    <Line type="monotone" dataKey="rendah" stroke="#16a34a" name="Rendah" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sedang" stroke="#eab308" name="Sedang" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="parah" stroke="#ef4444" name="Parah" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                  <Baby size={16} className="text-green-600" /> Status Gizi Balita
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={nutritionPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }: { name: string; value: number }) => `${name}: ${value}%`} labelLine={false}>
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
            <div className="rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-5">
                <Wheat size={16} className="text-green-600" /> Penggunaan Voucher per Kategori Pangan
              </div>
              <div className="flex flex-col gap-3">
                {categoryUsage.map((cat) => (
                  <div key={cat.kategori} className="flex items-center gap-3">
                    <span className="w-16 sm:w-20 text-xs sm:text-sm text-gray-500 shrink-0">{cat.kategori}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-green-600 transition-all duration-700" style={{ width: `${cat.persen}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs sm:text-sm font-semibold text-gray-700 shrink-0">{cat.persen}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Users size={16} className="text-green-600" /> Detail per Provinsi
                </div>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:border-green-600 hover:text-green-600 transition-colors">
                  <Download size={13} /> Unduh CSV
                </button>
              </div>
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-sm border-collapse min-w-[360px]">
                  <thead>
                    <tr>
                      {['Provinsi', 'Penerima', 'Voucher', 'Penukaran'].map((h, i) => (
                        <th key={h} className={`py-2.5 font-semibold text-gray-400 border-b border-gray-100 text-xs tracking-wide ${i === 0 ? 'text-left' : 'text-right'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {regionData.map((r) => (
                      <tr key={r.provinsi}>
                        <td className="py-3 font-semibold text-gray-900 border-b border-gray-50">{r.provinsi}</td>
                        <td className="py-3 text-right text-gray-500 border-b border-gray-50">{r.penerima.toLocaleString('id-ID')}</td>
                        <td className="py-3 text-right text-gray-500 border-b border-gray-50">{r.voucher.toLocaleString('id-ID')}</td>
                        <td className="py-3 text-right border-b border-gray-50">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.penukaran >= 85 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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