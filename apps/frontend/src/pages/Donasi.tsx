import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { SEO } from "../components/SEO";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useStaggerChildren } from "../hooks/useStaggerChildren";
import { Check, ArrowRight, Baby, Heart, Building2, Sparkles } from "lucide-react";
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
    <div className="donation-page min-h-screen relative overflow-hidden">
      <SEO
        title="Donasi Pangan Bergizi"
        description="Pilih paket donasi untuk balita, program 1000 HPK, atau corporate CSR. Salurkan bantuan pangan bergizi untuk keluarga rentan di Indonesia melalui SeribuAsa."
        canonical="https://seribuasa.id/donasi"
        keywords="donasi pangan, donasi balita, csr pangan, bantuan 1000 hpk, donasi online indonesia"
      />

      <style>
        {`
          .donation-page,
          .donation-page * {
            box-sizing: border-box;
          }

          .donation-page {
            background:
              radial-gradient(circle at 0% 12%, rgba(47, 111, 70, 0.12) 0%, transparent 25%),
              radial-gradient(circle at 100% 18%, rgba(47, 111, 70, 0.10) 0%, transparent 24%),
              linear-gradient(180deg, #fbf6ec 0%, #f7f1e5 100%);
            color: #173b2a;
          }

          .donation-bg-blob-left,
          .donation-bg-blob-right,
          .donation-bg-small {
            position: absolute;
            pointer-events: none;
            z-index: 0;
            background: #2f6f46;
          }

          .donation-bg-blob-left {
            left: -260px;
            top: 110px;
            width: 420px;
            height: 480px;
            opacity: 0.10;
            border-radius: 52% 48% 62% 38% / 46% 58% 42% 54%;
            transform: rotate(-18deg);
          }

          .donation-bg-blob-right {
            right: -280px;
            top: 190px;
            width: 460px;
            height: 520px;
            opacity: 0.10;
            border-radius: 48% 52% 38% 62% / 54% 42% 58% 46%;
            transform: rotate(16deg);
          }

          .donation-bg-small {
            right: 10%;
            top: 620px;
            width: 130px;
            height: 115px;
            opacity: 0.06;
            border-radius: 60% 40% 55% 45% / 52% 60% 40% 48%;
            transform: rotate(-10deg);
          }

          .donation-main {
            position: relative;
            z-index: 2;
          }

          .donation-hero {
            max-width: 980px;
            margin: 0 auto;
            text-align: center;
            padding: clamp(28px, 5vw, 58px) 0 clamp(28px, 5vw, 48px);
          }

          .donation-kicker {
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

          .donation-title {
            margin: 18px auto 0;
            max-width: 820px;
            font-family: Georgia, "Times New Roman", serif;
            font-size: clamp(42px, 7vw, 82px);
            line-height: 0.98;
            letter-spacing: -0.055em;
            font-weight: 850;
            color: #154632;
          }

          .donation-subtitle {
            max-width: 610px;
            margin: 22px auto 0;
            color: #617166;
            font-size: clamp(14px, 1.5vw, 16px);
            line-height: 1.85;
          }

          .donation-toggle-wrap {
            margin-top: 30px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 5px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.78);
            border: 1px solid rgba(47, 111, 70, 0.12);
            box-shadow:
              0 14px 30px rgba(29, 68, 44, 0.07),
              inset 0 1px 0 rgba(255, 255, 255, 0.80);
            backdrop-filter: blur(10px);
          }

          .donation-toggle-button {
            min-width: 116px;
            padding: 10px 18px;
            border-radius: 999px;
            border: 0;
            font-size: 13.5px;
            font-weight: 850;
            cursor: pointer;
            transition:
              background 0.2s ease,
              color 0.2s ease,
              box-shadow 0.2s ease,
              transform 0.2s ease;
          }

          .donation-toggle-button.active {
            background: #2f6f46;
            color: #ffffff;
            box-shadow: 0 10px 22px rgba(47, 111, 70, 0.20);
          }

          .donation-toggle-button:not(.active) {
            background: transparent;
            color: #66746b;
          }

          .donation-toggle-button:not(.active):hover {
            color: #154632;
            background: rgba(47, 111, 70, 0.06);
          }

          .plans-section {
            position: relative;
            margin-top: 8px;
          }

          .plans-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: clamp(18px, 2.5vw, 26px);
            max-width: 1060px;
            margin: 0 auto;
            align-items: stretch;
          }

          .plan-card {
            position: relative;
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 100%;
            border-radius: 30px;
            padding: 24px;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.66));
            border: 1px solid rgba(47, 111, 70, 0.11);
            box-shadow:
              0 20px 42px rgba(29, 68, 44, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.80);
            backdrop-filter: blur(10px);
            transition:
              transform 0.22s ease,
              box-shadow 0.22s ease,
              border-color 0.22s ease;
            overflow: hidden;
          }

          .plan-card::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at 100% 0%, rgba(47, 111, 70, 0.10), transparent 34%);
            pointer-events: none;
            opacity: 0.85;
          }

          .plan-card:hover {
            transform: translateY(-6px);
            border-color: rgba(47, 111, 70, 0.20);
            box-shadow:
              0 28px 54px rgba(29, 68, 44, 0.13),
              inset 0 1px 0 rgba(255, 255, 255, 0.86);
          }

          .plan-card.popular {
            background:
              radial-gradient(circle at 100% 0%, rgba(139, 195, 154, 0.22), transparent 32%),
              linear-gradient(180deg, #123d28 0%, #0b2f1d 100%);
            border-color: rgba(251, 246, 236, 0.16);
            box-shadow:
              0 28px 60px rgba(14, 37, 24, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.09);
          }

          .plan-badge {
            position: absolute;
            top: 18px;
            right: 18px;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 11px;
            border-radius: 999px;
            background: #fbf6ec;
            color: #2f6f46;
            font-size: 11px;
            font-weight: 850;
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
          }

          .plan-content {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .plan-icon {
            width: 52px;
            height: 52px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(47, 111, 70, 0.10);
            color: #2f6f46;
            margin-bottom: 18px;
          }

          .plan-card.popular .plan-icon {
            background: rgba(251, 246, 236, 0.12);
            color: #fbf6ec;
          }

          .plan-name {
            margin: 0;
            color: #154632;
            font-size: 21px;
            line-height: 1.12;
            font-weight: 900;
            letter-spacing: -0.03em;
          }

          .plan-card.popular .plan-name {
            color: #fbf6ec;
          }

          .plan-desc {
            margin: 10px 0 0;
            color: #63736a;
            font-size: 13.5px;
            line-height: 1.65;
          }

          .plan-card.popular .plan-desc {
            color: rgba(251, 246, 236, 0.72);
          }

          .plan-price {
            margin-top: 24px;
            padding: 20px 0;
            border-top: 1px solid rgba(47, 111, 70, 0.10);
            border-bottom: 1px solid rgba(47, 111, 70, 0.10);
          }

          .plan-card.popular .plan-price {
            border-color: rgba(251, 246, 236, 0.14);
          }

          .plan-price-main {
            color: #154632;
            font-size: clamp(28px, 3vw, 34px);
            line-height: 1;
            font-weight: 950;
            letter-spacing: -0.045em;
          }

          .plan-card.popular .plan-price-main {
            color: #fbf6ec;
          }

          .plan-period {
            margin-left: 6px;
            color: #7a8880;
            font-size: 13px;
            font-weight: 700;
          }

          .plan-card.popular .plan-period {
            color: rgba(251, 246, 236, 0.60);
          }

          .plan-features {
            display: flex;
            flex-direction: column;
            gap: 11px;
            margin: 22px 0 24px;
            padding: 0;
            list-style: none;
            flex: 1;
          }

          .plan-feature {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            color: #53645b;
            font-size: 13.5px;
            line-height: 1.5;
          }

          .plan-card.popular .plan-feature {
            color: rgba(251, 246, 236, 0.76);
          }

          .plan-check {
            width: 19px;
            height: 19px;
            border-radius: 999px;
            background: rgba(47, 111, 70, 0.10);
            color: #2f6f46;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            margin-top: 1px;
          }

          .plan-card.popular .plan-check {
            background: rgba(251, 246, 236, 0.14);
            color: #fbf6ec;
          }

          .plan-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            min-height: 46px;
            padding: 12px 18px;
            border-radius: 999px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 850;
            transition:
              transform 0.2s ease,
              background 0.2s ease,
              box-shadow 0.2s ease,
              border-color 0.2s ease,
              color 0.2s ease;
          }

          .plan-button.primary {
            background: #fbf6ec;
            color: #154632;
            box-shadow: 0 14px 28px rgba(0, 0, 0, 0.16);
          }

          .plan-button.primary:hover {
            transform: translateY(-2px);
            background: #ffffff;
          }

          .plan-button.secondary {
            background: rgba(47, 111, 70, 0.08);
            color: #2f6f46;
            border: 1px solid rgba(47, 111, 70, 0.14);
          }

          .plan-button.secondary:hover {
            transform: translateY(-2px);
            background: rgba(47, 111, 70, 0.12);
            border-color: rgba(47, 111, 70, 0.22);
          }

          .custom-donation {
            max-width: 900px;
            margin: clamp(42px, 6vw, 64px) auto 0;
            border-radius: 34px;
            overflow: hidden;
            display: grid;
            grid-template-columns: 0.95fr 1.05fr;
            background:
              linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0.64));
            border: 1px solid rgba(47, 111, 70, 0.11);
            box-shadow:
              0 22px 48px rgba(29, 68, 44, 0.09),
              inset 0 1px 0 rgba(255, 255, 255, 0.80);
            backdrop-filter: blur(10px);
          }

          .custom-copy {
            padding: clamp(26px, 4vw, 36px);
            background:
              radial-gradient(circle at 100% 0%, rgba(47, 111, 70, 0.12), transparent 36%),
              #f4eee2;
            border-right: 1px solid rgba(47, 111, 70, 0.10);
          }

          .custom-copy h2 {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            color: #154632;
            font-size: clamp(28px, 4vw, 42px);
            line-height: 1;
            letter-spacing: -0.045em;
          }

          .custom-copy p {
            margin: 14px 0 0;
            color: #617166;
            font-size: 14px;
            line-height: 1.75;
          }

          .custom-form {
            padding: clamp(26px, 4vw, 36px);
          }

          .custom-label {
            display: block;
            margin-bottom: 8px;
            color: #53645b;
            font-size: 13px;
            font-weight: 800;
          }

          .custom-input {
            width: 100%;
            height: 48px;
            padding: 0 15px;
            border-radius: 16px;
            border: 1px solid rgba(47, 111, 70, 0.16);
            background: rgba(255, 255, 255, 0.82);
            color: #173b2a;
            font-size: 14px;
            outline: none;
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease,
              background 0.2s ease;
          }

          .custom-input:focus {
            border-color: rgba(47, 111, 70, 0.42);
            box-shadow: 0 0 0 4px rgba(47, 111, 70, 0.08);
            background: #ffffff;
          }

          .quick-amounts {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 14px;
          }

          .quick-button {
            padding: 8px 12px;
            border-radius: 999px;
            border: 1px solid rgba(47, 111, 70, 0.14);
            background: rgba(255, 255, 255, 0.62);
            color: #617166;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition:
              background 0.2s ease,
              color 0.2s ease,
              border-color 0.2s ease,
              transform 0.2s ease;
          }

          .quick-button:hover {
            transform: translateY(-1px);
            border-color: rgba(47, 111, 70, 0.24);
            color: #2f6f46;
          }

          .quick-button.active {
            background: rgba(47, 111, 70, 0.10);
            border-color: rgba(47, 111, 70, 0.32);
            color: #2f6f46;
          }

          .custom-submit {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 48px;
            margin-top: 18px;
            border-radius: 999px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 850;
            transition:
              transform 0.2s ease,
              background 0.2s ease,
              box-shadow 0.2s ease;
          }

          .custom-submit.enabled {
            background: #2f6f46;
            color: #ffffff;
            box-shadow: 0 14px 26px rgba(47, 111, 70, 0.18);
          }

          .custom-submit.enabled:hover {
            transform: translateY(-2px);
            background: #265f3b;
          }

          .custom-submit.disabled {
            background: #eef0ec;
            color: #b8bfb8;
            cursor: not-allowed;
            pointer-events: none;
          }

          @media (max-width: 980px) {
            .plans-grid {
              grid-template-columns: 1fr;
              max-width: 520px;
            }

            .plan-card {
              border-radius: 26px;
            }

            .custom-donation {
              grid-template-columns: 1fr;
              max-width: 520px;
            }

            .custom-copy {
              border-right: 0;
              border-bottom: 1px solid rgba(47, 111, 70, 0.10);
            }
          }

          @media (max-width: 640px) {
            .donation-bg-blob-left {
              left: -300px;
              top: 130px;
              opacity: 0.09;
            }

            .donation-bg-blob-right {
              right: -330px;
              top: 240px;
              opacity: 0.08;
            }

            .donation-title {
              font-size: clamp(26px, 10vw, 30px);
            }

            .donation-toggle-button {
              min-width: 104px;
              padding: 9px 14px;
              font-size: 13px;
            }

            .plan-card {
              padding: 22px;
            }

            .custom-donation {
              border-radius: 26px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .plan-card,
            .plan-button,
            .quick-button,
            .custom-submit,
            .donation-toggle-button {
              transition: none;
            }

            .plan-card:hover,
            .plan-button:hover,
            .quick-button:hover,
            .custom-submit.enabled:hover {
              transform: none;
            }
          }
        `}
      </style>

      <div className="donation-bg-blob-left" />
      <div className="donation-bg-blob-right" />
      <div className="donation-bg-small" />

      <Navbar />

      <main className="donation-main pt-24 md:pt-28 pb-16 md:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <section ref={titleRef} className="donation-hero">
        
            <h1 className="donation-title">
              Pilih paket donasi untuk bantu nutrisi keluarga rentan.
            </h1>

            <p className="donation-subtitle">
              Setiap kontribusi akan disalurkan dalam bentuk e-voucher pangan bergizi
              agar bantuan lebih tepat sasaran, transparan, dan berdampak nyata.
            </p>

            <div className="donation-toggle-wrap">
              {["Bulanan", "Sekali Donasi"].map((label) => {
                const active = label === "Bulanan" ? isMonthly : !isMonthly;

                return (
                  <button
                    key={label}
                    onClick={() => setIsMonthly(label === "Bulanan")}
                    className={`donation-toggle-button ${active ? "active" : ""}`}
                    type="button"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Plans grid */}
          <section className="plans-section">
            <div ref={gridRef} className="plans-grid">
              {plans.map((plan) => {
                const Icon = plan.icon;

                return (
                  <article
                    key={plan.id}
                    className={`plan-card ${plan.popular ? "popular" : ""}`}
                  >
                    {plan.popular && (
                      <div className="plan-badge">
                        <Sparkles size={12} />
                        Paling Populer
                      </div>
                    )}

                    <div className="plan-content">
                      <div className="plan-icon">
                        <Icon size={23} />
                      </div>

                      <h2 className="plan-name">{plan.name}</h2>
                      <p className="plan-desc">{plan.desc}</p>

                      <div className="plan-price">
                        {plan.price > 0 ? (
                          <>
                            <span className="plan-price-main">
                              {formatIDR(plan.price)}
                            </span>
                            <span className="plan-period">
                              {isMonthly ? plan.period : ""}
                            </span>
                          </>
                        ) : (
                          <span className="plan-price-main">Hubungi Kami</span>
                        )}
                      </div>

                      <ul className="plan-features">
                        {plan.features.map((feature) => (
                          <li key={feature} className="plan-feature">
                            <span className="plan-check">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        to={
                          plan.price > 0
                            ? `/donation/checkout?plan=${plan.id}&type=${
                                isMonthly ? "monthly" : "once"
                              }`
                            : "/kontak"
                        }
                        className={`plan-button ${
                          plan.popular ? "primary" : "secondary"
                        }`}
                      >
                        {plan.price > 0 ? "Pilih Paket" : "Hubungi Tim"}
                        <ArrowRight size={15} strokeWidth={2.6} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Custom donation */}
          <section className="custom-donation">
            <div className="custom-copy">
              <h2>Donasi dengan jumlah pilihanmu.</h2>
              <p>
                Masukkan nominal donasi sesuai kemampuanmu. Bantuan akan tetap
                diarahkan untuk mendukung akses pangan bergizi bagi penerima manfaat.
              </p>
            </div>

            <div className="custom-form">
              <label className="custom-label">Jumlah donasi dalam Rupiah</label>

              <input
                type="number"
                placeholder="Contoh: 100000"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="custom-input"
              />

              <div className="quick-amounts">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCustomAmount(String(amount))}
                    className={`quick-button ${
                      customAmount === String(amount) ? "active" : ""
                    }`}
                    type="button"
                  >
                    {formatIDR(amount)}
                  </button>
                ))}
              </div>

              <Link
                to={
                  customAmount
                    ? `/donation/checkout?amount=${customAmount}&type=${
                        isMonthly ? "monthly" : "once"
                      }`
                    : "#"
                }
                className={`custom-submit ${
                  customAmount ? "enabled" : "disabled"
                }`}
              >
                Donasi Sekarang
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Donasi;