import type { RefObject } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { SEO } from "../components/SEO";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useCountUp } from "../hooks/useCountUp";
import { useStaggerChildren } from "../hooks/useStaggerChildren";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  MapPin,
  TrendingUp,
  Users,
  Wheat,
  Baby,
  Download,
  TicketCheck,
  Wallet,
  Percent,
  ArrowUpRight,
} from "lucide-react";

const regionData = [
  { provinsi: "Jawa Barat", penerima: 3200, voucher: 9600, penukaran: 89 },
  { provinsi: "Jawa Timur", penerima: 2800, voucher: 8400, penukaran: 91 },
  { provinsi: "Jawa Tengah", penerima: 2100, voucher: 6300, penukaran: 85 },
  { provinsi: "NTT", penerima: 1800, voucher: 5400, penukaran: 78 },
  { provinsi: "NTB", penerima: 1200, voucher: 3600, penukaran: 82 },
  { provinsi: "Sulawesi Selatan", penerima: 900, voucher: 2700, penukaran: 88 },
];

const fiesTrend = [
  { bulan: "Jul", rendah: 45, sedang: 35, parah: 20 },
  { bulan: "Agu", rendah: 48, sedang: 34, parah: 18 },
  { bulan: "Sep", rendah: 52, sedang: 32, parah: 16 },
  { bulan: "Okt", rendah: 55, sedang: 31, parah: 14 },
  { bulan: "Nov", rendah: 58, sedang: 30, parah: 12 },
  { bulan: "Des", rendah: 62, sedang: 28, parah: 10 },
];

const nutritionPie = [
  { name: "Normal", value: 65, color: "#2f6f46" },
  { name: "Waspada", value: 25, color: "#d59b2d" },
  { name: "Kritis", value: 10, color: "#c75b4a" },
];

const categoryUsage = [
  { kategori: "Telur", persen: 28 },
  { kategori: "Sayuran", persen: 22 },
  { kategori: "Susu", persen: 18 },
  { kategori: "Daging", persen: 14 },
  { kategori: "Buah", persen: 10 },
  { kategori: "Kacang", persen: 8 },
];

const kpis = [
  {
    end: 12500,
    suffix: "+",
    label: "Penerima Manfaat Aktif",
    desc: "Keluarga rentan yang menerima dukungan nutrisi",
    icon: Users,
  },
  {
    end: 45000,
    suffix: "+",
    label: "Voucher Tersalurkan",
    desc: "E-voucher nutrisi berhasil dialokasikan",
    icon: TicketCheck,
  },
  {
    end: 4200,
    prefix: "Rp",
    suffix: "Jt",
    label: "Dana Tersalurkan",
    desc: "Total donasi yang telah disalurkan",
    icon: Wallet,
  },
  {
    end: 87,
    suffix: "%",
    label: "Tingkat Penukaran",
    desc: "Voucher berhasil digunakan tepat sasaran",
    icon: Percent,
  },
];

function StatCounter({
  end,
  prefix = "",
  suffix = "",
}: {
  end: number;
  prefix?: string;
  suffix?: string;
}) {
  const { ref, display } = useCountUp({ end, prefix, suffix, separator: "." });

  return (
    <div ref={ref as RefObject<HTMLDivElement>} className="impact-kpi-number">
      {display}
    </div>
  );
}

const Dampak = () => {
  const titleRef = useScrollReveal({ y: 30 });
  const kpiRef = useStaggerChildren({ stagger: 0.1 });
  const chartsRef = useStaggerChildren({ stagger: 0.1 });

  return (
    <div className="impact-page min-h-screen relative overflow-hidden">
      <SEO
        title="Dampak & Transparansi"
        description="Lihat dampak nyata donasi Anda melalui dashboard transparan SeribuAsa. Data penerima manfaat, voucher tersalurkan, dan status gizi balita di seluruh Indonesia."
        canonical="https://seribuasa.id/dampak"
        keywords="dampak donasi, transparansi donasi, data penerima manfaat, status gizi indonesia, voucher tersalurkan"
      />

      <style>
        {`
          .impact-page,
          .impact-page * {
            box-sizing: border-box;
          }

          .impact-page {
            position: relative;
            background:
              radial-gradient(circle at 0% 10%, rgba(47, 111, 70, 0.11) 0%, transparent 24%),
              radial-gradient(circle at 100% 18%, rgba(47, 111, 70, 0.09) 0%, transparent 24%),
              linear-gradient(180deg, #fbf6ec 0%, #f7f1e5 100%);
            color: #173b2a;
          }

          .impact-bg-left,
          .impact-bg-right,
          .impact-bg-small {
            position: absolute;
            pointer-events: none;
            z-index: 0;
            background: #2f6f46;
          }

          .impact-bg-left {
            left: -260px;
            top: 110px;
            width: 420px;
            height: 490px;
            opacity: 0.10;
            border-radius: 52% 48% 62% 38% / 46% 58% 42% 54%;
            transform: rotate(-18deg);
          }

          .impact-bg-right {
            right: -300px;
            top: 210px;
            width: 480px;
            height: 540px;
            opacity: 0.10;
            border-radius: 48% 52% 38% 62% / 54% 42% 58% 46%;
            transform: rotate(16deg);
          }

          .impact-bg-small {
            right: 12%;
            top: 620px;
            width: 140px;
            height: 124px;
            opacity: 0.055;
            border-radius: 60% 40% 55% 45% / 52% 60% 40% 48%;
            transform: rotate(-10deg);
          }

          .impact-main {
            position: relative;
            z-index: 2;
          }

          .impact-container {
            width: 100%;
            max-width: 1180px;
            margin: 0 auto;
            padding-inline: clamp(18px, 4vw, 34px);
          }

          .impact-hero {
            position: relative;
            width: 100%;
            padding: clamp(32px, 6vw, 72px) 0 clamp(26px, 5vw, 52px);
          }

          .impact-hero-copy {
            max-width: 760px;
            margin-left: 0;
          }

          .impact-kicker {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            border-radius: 999px;
            background: rgba(47, 111, 70, 0.08);
            border: 1px solid rgba(47, 111, 70, 0.12);
            color: #2f6f46;
            font-size: 12px;
            font-weight: 850;
          }

          .impact-title {
            margin: 18px 0 0;
            max-width: 760px;
            font-family: Georgia, "Times New Roman", serif;
            font-size: clamp(40px, 5.8vw, 72px);
            line-height: 1;
            letter-spacing: -0.055em;
            font-weight: 850;
            color: #154632;
          }

          .impact-subtitle {
            max-width: 610px;
            margin: 24px 0 0;
            color: #617166;
            font-size: clamp(14px, 1.5vw, 16px);
            line-height: 1.9;
          }

          .impact-hero-line {
            width: min(440px, 88%);
            height: 1px;
            margin-top: 30px;
            background: linear-gradient(
              90deg,
              rgba(47, 111, 70, 0.28),
              rgba(47, 111, 70, 0.08),
              transparent
            );
          }

          .impact-export {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            margin-top: 28px;
            min-height: 44px;
            padding: 11px 18px;
            border-radius: 999px;
            border: 1px solid rgba(47, 111, 70, 0.14);
            background: rgba(255, 255, 255, 0.72);
            color: #2f6f46;
            font-size: 14px;
            font-weight: 850;
            text-decoration: none;
            box-shadow:
              0 14px 30px rgba(29, 68, 44, 0.07),
              inset 0 1px 0 rgba(255, 255, 255, 0.80);
            backdrop-filter: blur(10px);
            transition:
              transform 0.2s ease,
              background 0.2s ease,
              border-color 0.2s ease;
          }

          .impact-export:hover {
            transform: translateY(-2px);
            background: #ffffff;
            border-color: rgba(47, 111, 70, 0.24);
          }

          .impact-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: clamp(14px, 2vw, 20px);
            width: 100%;
            margin: 0 0 clamp(30px, 5vw, 48px);
          }

          .impact-kpi-card {
            position: relative;
            overflow: hidden;
            min-width: 0;
            border-radius: 26px;
            padding: 22px 20px;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.66));
            border: 1px solid rgba(47, 111, 70, 0.11);
            box-shadow:
              0 20px 42px rgba(29, 68, 44, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.80);
            backdrop-filter: blur(10px);
          }

          .impact-kpi-card::before {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 100% 0%, rgba(47, 111, 70, 0.10), transparent 34%);
            pointer-events: none;
          }

          .impact-kpi-content {
            position: relative;
            z-index: 2;
          }

          .impact-kpi-icon {
            width: 42px;
            height: 42px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #2f6f46;
            color: #ffffff;
            margin-bottom: 16px;
            box-shadow: 0 12px 24px rgba(47, 111, 70, 0.16);
          }

          .impact-kpi-number {
            color: #154632;
            font-size: clamp(28px, 3.2vw, 38px);
            line-height: 1;
            font-weight: 950;
            letter-spacing: -0.045em;
          }

          .impact-kpi-label {
            margin-top: 9px;
            color: #173b2a;
            font-size: 13.5px;
            line-height: 1.25;
            font-weight: 850;
          }

          .impact-kpi-desc {
            margin-top: 7px;
            color: #6b786f;
            font-size: 12.5px;
            line-height: 1.55;
          }

          .charts-layout {
            display: grid;
            gap: clamp(18px, 2.5vw, 24px);
            width: 100%;
            margin: 0;
          }

          .chart-card {
            position: relative;
            overflow: hidden;
            border-radius: 30px;
            padding: clamp(20px, 3vw, 28px);
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.66));
            border: 1px solid rgba(47, 111, 70, 0.11);
            box-shadow:
              0 20px 42px rgba(29, 68, 44, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.80);
            backdrop-filter: blur(10px);
          }

          .chart-card.dark {
            background:
              radial-gradient(circle at 100% 0%, rgba(139, 195, 154, 0.20), transparent 34%),
              linear-gradient(180deg, #123d28 0%, #0b2f1d 100%);
            border-color: rgba(251, 246, 236, 0.16);
            box-shadow:
              0 28px 60px rgba(14, 37, 24, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.09);
          }

          .chart-header {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 22px;
          }

          .chart-title-wrap {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            max-width: 680px;
          }

          .chart-icon {
            width: 42px;
            height: 42px;
            border-radius: 16px;
            background: rgba(47, 111, 70, 0.10);
            color: #2f6f46;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
          }

          .chart-card.dark .chart-icon {
            background: rgba(251, 246, 236, 0.12);
            color: #fbf6ec;
          }

          .chart-title {
            margin: 0;
            color: #154632;
            font-size: clamp(18px, 2vw, 22px);
            line-height: 1.15;
            font-weight: 900;
            letter-spacing: -0.03em;
          }

          .chart-card.dark .chart-title {
            color: #fbf6ec;
          }

          .chart-desc {
            margin: 7px 0 0;
            color: #6b786f;
            font-size: 13px;
            line-height: 1.55;
          }

          .chart-card.dark .chart-desc {
            color: rgba(251, 246, 236, 0.68);
          }

          .chart-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 11px;
            border-radius: 999px;
            background: rgba(47, 111, 70, 0.08);
            color: #2f6f46;
            font-size: 11.5px;
            font-weight: 850;
            white-space: nowrap;
          }

          .chart-card.dark .chart-badge {
            background: rgba(251, 246, 236, 0.10);
            color: #fbf6ec;
          }

          .chart-grid-two {
            display: grid;
            grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
            gap: clamp(18px, 2.5vw, 24px);
            align-items: stretch;
          }

          .chart-visual-wide {
            width: 100%;
            min-height: 310px;
          }

          .chart-visual-medium {
            width: 100%;
            min-height: 270px;
          }

          .category-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
          }

          .category-row {
            display: grid;
            grid-template-columns: 104px minmax(0, 1fr) 48px;
            gap: 16px;
            align-items: center;
            width: 100%;
          }

          .category-label {
            color: #53645b;
            font-size: 13px;
            font-weight: 800;
          }

          .category-track {
            height: 13px;
            border-radius: 999px;
            background: rgba(47, 111, 70, 0.08);
            overflow: hidden;
            width: 100%;
          }

          .category-fill {
            height: 100%;
            border-radius: inherit;
            background:
              linear-gradient(90deg, #2f6f46, #6aaf77);
            transition: width 0.7s ease;
          }

          .category-value {
            color: #154632;
            font-size: 13px;
            font-weight: 900;
            text-align: right;
          }

          .recharts-wrapper,
          .recharts-surface {
            outline: none;
          }

          @media (max-width: 980px) {
            .impact-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .chart-grid-two {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 640px) {
            .impact-title {
              font-size: clamp(36px, 11vw, 52px);
            }

            .impact-bg-left {
              left: -310px;
              top: 120px;
              width: 400px;
              height: 450px;
              opacity: 0.08;
            }

            .impact-bg-right {
              right: -340px;
              top: 240px;
              width: 430px;
              height: 480px;
              opacity: 0.075;
            }

            .impact-bg-small {
              display: none;
            }

            .impact-kpi-grid {
              grid-template-columns: 1fr;
            }

            .chart-header {
              flex-direction: column;
            }

            .chart-badge {
              width: fit-content;
            }

            .category-row {
              grid-template-columns: 74px minmax(0, 1fr) 38px;
              gap: 10px;
            }

            .category-label,
            .category-value {
              font-size: 12px;
            }

            .chart-card {
              border-radius: 24px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .impact-export,
            .category-fill {
              transition: none;
            }

            .impact-export:hover {
              transform: none;
            }
          }
        `}
      </style>

      <div className="impact-bg-left" />
      <div className="impact-bg-right" />
      <div className="impact-bg-small" />

      <Navbar />

      <main className="impact-main pt-24 md:pt-28 pb-16 md:pb-20">
        <div className="impact-container">
          {/* Hero */}
          <section ref={titleRef} className="impact-hero">
            <div className="impact-hero-copy">
              <h1 className="impact-title">
                Transparansi bantuan nutrisi dalam satu tampilan.
              </h1>

              <p className="impact-subtitle">
                Pantau bagaimana donasi tersalurkan, voucher digunakan, dan
                perubahan kondisi pangan keluarga penerima dari waktu ke waktu.
              </p>

              <div className="impact-hero-line" />

              <a href="#" className="impact-export">
                <Download size={16} />
                Unduh Laporan
              </a>
            </div>
          </section>

          {/* KPI */}
          <section ref={kpiRef} className="impact-kpi-grid">
            {kpis.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.label} className="impact-kpi-card">
                  <div className="impact-kpi-content">
                    <div className="impact-kpi-icon">
                      <Icon size={20} />
                    </div>

                    <StatCounter
                      end={item.end}
                      prefix={item.prefix}
                      suffix={item.suffix}
                    />

                    <div className="impact-kpi-label">{item.label}</div>
                    <p className="impact-kpi-desc">{item.desc}</p>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Charts */}
          <section ref={chartsRef} className="charts-layout">
            <article className="chart-card dark">
              <div className="chart-header">
                <div className="chart-title-wrap">
                  <div className="chart-icon">
                    <MapPin size={20} />
                  </div>

                  <div>
                    <h2 className="chart-title">Dampak per Wilayah</h2>
                    <p className="chart-desc">
                      Perbandingan jumlah penerima dan voucher yang tersalurkan
                      di beberapa wilayah prioritas.
                    </p>
                  </div>
                </div>

                <div className="chart-badge">
                  <ArrowUpRight size={13} />
                  Data wilayah
                </div>
              </div>

              <div className="chart-visual-wide">
                <ResponsiveContainer width="100%" height={310}>
                  <BarChart
                    data={regionData}
                    margin={{ top: 10, right: 18, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(251,246,236,0.10)"
                    />
                    <XAxis
                      dataKey="provinsi"
                      tick={{ fill: "rgba(251,246,236,0.65)", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(251,246,236,0.16)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "rgba(251,246,236,0.65)", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(251,246,236,0.16)" }}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(251,246,236,0.06)" }}
                      contentStyle={{
                        background: "#fbf6ec",
                        border: "1px solid rgba(47,111,70,0.14)",
                        borderRadius: 14,
                        fontSize: 13,
                        color: "#173b2a",
                        boxShadow: "0 14px 30px rgba(0,0,0,0.14)",
                      }}
                    />
                    <Bar
                      dataKey="penerima"
                      fill="#fbf6ec"
                      radius={[8, 8, 0, 0]}
                      name="Penerima"
                    />
                    <Bar
                      dataKey="voucher"
                      fill="#7fbd8b"
                      radius={[8, 8, 0, 0]}
                      name="Voucher"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <div className="chart-grid-two">
              <article className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-wrap">
                    <div className="chart-icon">
                      <TrendingUp size={20} />
                    </div>

                    <div>
                      <h2 className="chart-title">Tren Ketahanan Pangan</h2>
                      <p className="chart-desc">
                        Perubahan skor FIES dari bulan ke bulan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="chart-visual-medium">
                  <ResponsiveContainer width="100%" height={270}>
                    <LineChart
                      data={fiesTrend}
                      margin={{ top: 10, right: 18, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(47,111,70,0.10)"
                      />
                      <XAxis
                        dataKey="bulan"
                        tick={{ fill: "#7a8880", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(47,111,70,0.12)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#7a8880", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(47,111,70,0.12)" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid rgba(47,111,70,0.14)",
                          borderRadius: 14,
                          fontSize: 13,
                          boxShadow: "0 14px 30px rgba(29,68,44,0.10)",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="rendah"
                        stroke="#2f6f46"
                        name="Rendah"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="sedang"
                        stroke="#d59b2d"
                        name="Sedang"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="parah"
                        stroke="#c75b4a"
                        name="Parah"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-wrap">
                    <div className="chart-icon">
                      <Baby size={20} />
                    </div>

                    <div>
                      <h2 className="chart-title">Status Gizi Balita</h2>
                      <p className="chart-desc">
                        Distribusi status gizi dari penerima manfaat anak.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="chart-visual-medium">
                  <ResponsiveContainer width="100%" height={270}>
                    <PieChart>
                      <Pie
                        data={nutritionPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        dataKey="value"
                        label={({
                          name,
                          value,
                        }: {
                          name: string;
                          value: number;
                        }) => `${name}: ${value}%`}
                        labelLine={false}
                      >
                        {nutritionPie.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid rgba(47,111,70,0.14)",
                          borderRadius: 14,
                          fontSize: 13,
                          boxShadow: "0 14px 30px rgba(29,68,44,0.10)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>

            <article className="chart-card">
              <div className="chart-header">
                <div className="chart-title-wrap">
                  <div className="chart-icon">
                    <Wheat size={20} />
                  </div>

                  <div>
                    <h2 className="chart-title">
                      Penggunaan Voucher per Kategori Pangan
                    </h2>
                    <p className="chart-desc">
                      Komposisi pembelian bahan pangan bergizi oleh penerima manfaat.
                    </p>
                  </div>
                </div>

                <div className="chart-badge">
                  <ArrowUpRight size={13} />
                  Kategori pangan
                </div>
              </div>

              <div className="category-list">
                {categoryUsage.map((cat) => (
                  <div key={cat.kategori} className="category-row">
                    <span className="category-label">{cat.kategori}</span>

                    <div className="category-track">
                      <div
                        className="category-fill"
                        style={{ width: `${cat.persen}%` }}
                      />
                    </div>

                    <span className="category-value">{cat.persen}%</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dampak;