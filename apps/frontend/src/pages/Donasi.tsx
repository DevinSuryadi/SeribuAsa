import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { SEO } from "../components/SEO";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useStaggerChildren } from "../hooks/useStaggerChildren";
import { Check, ArrowRight, Baby, Heart, Building2 } from "lucide-react";
import { formatIDR } from "../lib/format";

const plans = [
  {
    id: "balita",
    name: "Adopsi Nutrisi 1 Balita",
    price: 300000,
    period: "/bulan",
    icon: Baby,
    popular: true,
    desc: "Dukung nutrisi lengkap satu balita setiap bulan.",
    features: [
      "Voucher pangan bergizi bulanan",
      "Laporan dampak per anak",
      "Sertifikat donasi digital",
      "Pemantauan gizi anak",
    ],
  },
  {
    id: "1000hpk",
    name: "Paket 1000 HPK",
    price: 500000,
    period: "/bulan",
    icon: Heart,
    popular: false,
    desc: "Dukung ibu hamil dan bayi di 1000 Hari Pertama Kehidupan.",
    features: [
      "Semua fitur Adopsi Nutrisi",
      "Dukungan nutrisi ibu hamil",
      "Pemantauan pertumbuhan 1000 HPK",
      "Rekomendasi nutrisi AI",
      "Laporan dampak mendalam",
    ],
  },
  {
    id: "corporate",
    name: "Corporate Impact Plan",
    price: 0,
    period: "custom",
    icon: Building2,
    popular: false,
    desc: "Program CSR terukur untuk perusahaan Anda.",
    features: [
      "Semua fitur Paket 1000 HPK",
      "Dashboard CSR khusus",
      "Laporan dampak untuk stakeholder",
      "Employee matching program",
      "Branding & kampanye kustom",
      "Account manager dedicated",
    ],
  },
];

const quickAmounts = [50000, 100000, 250000, 500000];

const Donasi = () => {
  const [isMonthly, setIsMonthly] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const titleRef = useScrollReveal({ y: 30 });
  const gridRef = useStaggerChildren({ stagger: 0.15 });

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <SEO
        title="Donasi Pangan Bergizi"
        description="Pilih paket donasi untuk balita, program 1000 HPK, atau corporate CSR. Salurkan bantuan pangan bergizi untuk keluarga rentan di Indonesia melalui SeribuAsa."
        canonical="https://seribuasa.id/donasi"
        keywords="donasi pangan, donasi balita, csr pangan, bantuan 1000 hpk, donasi online indonesia"
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)",
        }}
      />
      <div
        className="fixed -top-16 -left-24 w-96 h-96 rounded-full pointer-events-none z-0"
        style={{ background: "rgba(34,197,94,0.06)", filter: "blur(70px)" }}
      />

      <Navbar />

      <main className="pt-24 md:pt-28 pb-16 md:pb-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div ref={titleRef} className="text-center mb-10 md:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Paket Donasi
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-400 max-w-sm mx-auto leading-relaxed">
              Pilih cara Anda berkontribusi untuk nutrisi anak Indonesia.
            </p>
            <div className="mt-6 inline-flex items-center gap-1 p-1 rounded-full border border-gray-200 bg-white/80 backdrop-blur-md">
              {["Bulanan", "Sekali Donasi"].map((label) => {
                const active = label === "Bulanan" ? isMonthly : !isMonthly;
                return (
                  <button
                    key={label}
                    onClick={() => setIsMonthly(label === "Bulanan")}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${active ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plans grid */}
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto"
          >
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white/85 backdrop-blur-md p-6 transition-all duration-200 hover:-translate-y-1 ${plan.popular ? "border-green-500 shadow-lg shadow-green-100" : "border-gray-100 shadow-sm hover:shadow-md"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                    Paling Populer
                  </div>
                )}
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                  <plan.icon className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-base font-bold text-gray-900">{plan.name}</div>
                <div className="mt-1 text-sm text-gray-400 leading-relaxed">{plan.desc}</div>
                <div className="my-4 pb-4 border-b border-gray-100">
                  {plan.price > 0 ? (
                    <>
                      <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        {formatIDR(plan.price)}
                      </span>
                      <span className="text-sm text-gray-400 ml-1">
                        {isMonthly ? plan.period : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-gray-900">Hubungi Kami</span>
                  )}
                </div>
                <ul className="flex flex-col gap-2 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-500">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={
                    plan.price > 0
                      ? `/donation/checkout?plan=${plan.id}&type=${isMonthly ? "monthly" : "once"}`
                      : "/kontak"
                  }
                  className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 ${plan.popular ? "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {plan.price > 0 ? "Pilih Paket" : "Hubungi Tim"}
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            ))}
          </div>

          {/* Custom donation */}
          <div className="max-w-md mx-auto mt-12 rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md p-6 shadow-sm">
            <div className="text-center mb-5">
              <div className="text-base font-bold text-gray-900">Donasi Jumlah Lainnya</div>
              <div className="mt-1 text-sm text-gray-400">
                Masukkan jumlah donasi sesuai keinginan Anda
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Jumlah (IDR)</label>
            <input
              type="number"
              placeholder="Contoh: 100000"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none bg-white transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCustomAmount(String(amt))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${customAmount === String(amt) ? "border-green-500 bg-green-50 text-green-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                >
                  {formatIDR(amt)}
                </button>
              ))}
            </div>
            <Link
              to={
                customAmount
                  ? `/donation/checkout?amount=${customAmount}&type=${isMonthly ? "monthly" : "once"}`
                  : "#"
              }
              className={`flex items-center justify-center w-full mt-4 py-3 rounded-xl text-sm font-semibold transition-all ${customAmount ? "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200" : "bg-gray-100 text-gray-300 cursor-not-allowed pointer-events-none"}`}
            >
              Donasi Sekarang
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Donasi;
