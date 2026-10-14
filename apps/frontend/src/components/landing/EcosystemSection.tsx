import { useState, type KeyboardEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const roles = [
  {
    name: "Donatur",
    subtitle: "Individu, korporasi, lembaga",
    lead: "Donasimu langsung jadi voucher pangan bergizi.",
    steps: [
      "Pilih paket donasi bulanan atau sekali.",
      "Dana dikonversi menjadi e-voucher nutrisi.",
      "Pantau penukaran dan dampaknya di dasbor.",
    ],
    note: "Cocok juga untuk program CSR dengan laporan dampak.",
    cta: "Mulai donasi",
    href: "/donasi",
  },
  {
    name: "Distributor",
    subtitle: "Puskesmas & klinik",
    lead: "Faskes memastikan bantuan sampai ke keluarga yang tepat.",
    steps: [
      "Data keluarga dengan anak di 1000 HPK.",
      "Isi kuesioner FIES untuk menentukan prioritas.",
      "Salurkan paket pangan dan catat pertumbuhan anak.",
    ],
    note: "Penerima manfaat didata oleh faskes, bukan mendaftar sendiri.",
    cta: "Daftar fasilitas kesehatan",
    href: "/register?role=health_facility",
  },
  {
    name: "Mitra Vendor",
    subtitle: "Toko kelontong, tukang sayur, UMKM",
    lead: "Jual pangan bergizi, dibayar lewat e-voucher.",
    steps: [
      "Daftar dan lolos verifikasi usaha.",
      "Siapkan produk sesuai katalog yang disetujui.",
      "Terima pembayaran dari voucher yang ditukar.",
    ],
    note: "Tambahan pelanggan tetap dari program nutrisi.",
    cta: "Daftar jadi vendor",
    href: "/register?role=vendor",
  },
  {
    name: "Penerima Manfaat",
    subtitle: "Keluarga rentan & anak usia dini",
    lead: "Telur, susu, dan sayur segar untuk tumbuh kembang anak.",
    steps: [
      "Didata oleh puskesmas atau klinik terdekat.",
      "Terima e-voucher sesuai prioritas kebutuhan.",
      "Tukar voucher dengan pangan bergizi di mitra vendor.",
    ],
    note: "Prioritas berdasarkan skor FIES, yang paling rentan lebih dulu.",
    cta: "Cara mendaftar",
    href: "/register?role=beneficiary",
  },
];

export function EcosystemSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useScrollReveal({ y: 28 });
  const activeRole = roles[activeIndex];

  const selectRole = (index: number, focus = false) => {
    setActiveIndex(index);

    if (focus) {
      requestAnimationFrame(() => {
        document.getElementById(`ecosystem-tab-${index}`)?.focus();
      });
    }
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      selectRole((index + 1) % roles.length, true);
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectRole((index - 1 + roles.length) % roles.length, true);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="ecosystem-section"
      id="ekosistem"
      aria-labelledby="ecosystem-title"
    >
      <style>
        {`
          .ecosystem-section,
          .ecosystem-section * {
            box-sizing: border-box;
          }

          .ecosystem-section {
            --eco-cream: #f6f3ea;
            --eco-ink: #14201a;
            --eco-muted: #6e746b;
            --eco-green: #173d26;
            --eco-accent: #2e6b3e;
            --eco-lime: #b5d69a;
            --eco-line: rgba(20, 32, 26, 0.14);
            color: var(--eco-ink);
            background: var(--eco-cream);
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          }

          .ecosystem-inner {
            width: min(1200px, 100%);
            margin: 0 auto;
            padding: clamp(72px, 8vw, 104px) 32px clamp(88px, 9vw, 120px);
          }

          .ecosystem-eyebrow {
            margin: 0 0 14px;
            color: var(--eco-accent);
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.14em;
            text-align: center;
            text-transform: uppercase;
          }

          .ecosystem-serif {
            font-family: Georgia, "Times New Roman", serif;
            font-weight: 400;
            letter-spacing: -0.025em;
          }

          .ecosystem-title {
            max-width: 760px;
            margin: 0 auto clamp(44px, 6vw, 64px);
            font-size: clamp(38px, 4.6vw, 60px);
            line-height: 1.02;
            text-align: center;
          }

          .ecosystem-title em {
            color: var(--eco-accent);
            font-weight: inherit;
          }

          .ecosystem-layout {
            display: grid;
            grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
            gap: clamp(36px, 5vw, 56px);
            align-items: stretch;
          }

          .ecosystem-tabs {
            display: flex;
            flex-direction: column;
            border-top: 1px solid var(--eco-line);
          }

          .ecosystem-tab {
            display: flex;
            align-items: baseline;
            gap: 20px;
            min-height: 44px;
            padding: 26px 0;
            color: var(--eco-muted);
            font: inherit;
            text-align: left;
            background: transparent;
            border: 0;
            border-bottom: 1px solid var(--eco-line);
            cursor: pointer;
            transition: color 180ms ease;
          }

          .ecosystem-tab:hover,
          .ecosystem-tab[aria-selected="true"] {
            color: var(--eco-ink);
          }

          .ecosystem-tab:focus-visible {
            outline: 2px solid var(--eco-accent);
            outline-offset: 4px;
          }

          .ecosystem-tab-number {
            width: 24px;
            flex: none;
            font-size: 12px;
          }

          .ecosystem-tab-copy {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
          }

          .ecosystem-tab-name {
            font-size: clamp(32px, 3.2vw, 40px);
            line-height: 1;
          }

          .ecosystem-tab-subtitle {
            font-size: 13px;
            line-height: 1.45;
          }

          .ecosystem-tab-arrow {
            font-size: 20px;
            opacity: 0;
            transform: translateX(-6px);
            transition: opacity 180ms ease, transform 180ms ease;
          }

          .ecosystem-tab[aria-selected="true"] .ecosystem-tab-arrow {
            opacity: 1;
            transform: translateX(0);
          }

          .ecosystem-card {
            min-height: 100%;
            overflow: hidden;
            color: var(--eco-cream);
            background: var(--eco-green);
            border-radius: 24px;
            box-shadow: 0 28px 70px rgba(23, 61, 38, 0.13);
          }

          .ecosystem-card-content {
            display: flex;
            min-height: 100%;
            flex-direction: column;
            animation: ecosystem-card-enter 240ms ease both;
          }

          .ecosystem-card-body {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 20px;
            padding: 32px;
          }

          .ecosystem-card-lead {
            max-width: 480px;
            margin: 0;
            font-size: clamp(34px, 3.4vw, 40px);
            line-height: 1.05;
          }

          .ecosystem-steps {
            margin: 0;
            padding: 0;
            list-style: none;
            border-top: 1px solid rgba(246, 243, 234, 0.18);
          }

          .ecosystem-step {
            display: flex;
            gap: 16px;
            padding: 14px 0;
            font-size: 15px;
            line-height: 1.5;
            border-bottom: 1px solid rgba(246, 243, 234, 0.18);
          }

          .ecosystem-step-number {
            width: 20px;
            flex: none;
            padding-top: 3px;
            color: var(--eco-lime);
            font-size: 12px;
          }

          .ecosystem-card-foot {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            margin-top: auto;
          }

          .ecosystem-card-note {
            max-width: 280px;
            margin: 0;
            color: rgba(246, 243, 234, 0.75);
            font-size: 13px;
            line-height: 1.5;
          }

          .ecosystem-card-cta {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 14px 22px;
            color: var(--eco-green);
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            background: var(--eco-cream);
            border-radius: 999px;
            transition: opacity 180ms ease, transform 180ms ease;
          }

          .ecosystem-card-cta:hover {
            opacity: 0.88;
            transform: translateY(-1px);
          }

          @keyframes ecosystem-card-enter {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @media (max-width: 980px) {
            .ecosystem-layout {
              grid-template-columns: minmax(0, 1fr);
              gap: 32px;
            }

            .ecosystem-tab-name {
              font-size: 36px;
            }
          }

          @media (max-width: 560px) {
            .ecosystem-inner {
              padding: 72px 16px 88px;
            }

            .ecosystem-title {
              font-size: clamp(36px, 11vw, 46px);
            }

            .ecosystem-tab {
              gap: 14px;
              padding: 22px 0;
            }

            .ecosystem-tab-name {
              font-size: 30px;
            }

            .ecosystem-card-body {
              padding: 28px 22px 24px;
            }

            .ecosystem-card-lead {
              font-size: 31px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .ecosystem-tab,
            .ecosystem-tab-arrow,
            .ecosystem-card-content,
            .ecosystem-card-cta {
              animation: none;
              transition: none;
            }
          }
        `}
      </style>

      <div className="ecosystem-inner">
        <p className="ecosystem-eyebrow">Ekosistem SeribuAsa</p>
        <h2 className="ecosystem-title ecosystem-serif" id="ecosystem-title">
          Di mana peranmu dalam <em>1000 hari</em> pertama?
        </h2>

        <div className="ecosystem-layout">
          <div
            className="ecosystem-tabs"
            role="tablist"
            aria-label="Peran dalam ekosistem"
          >
            {roles.map((role, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={role.name}
                  className="ecosystem-tab"
                  id={`ecosystem-tab-${index}`}
                  type="button"
                  role="tab"
                  aria-controls="ecosystem-panel"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => selectRole(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  <span className="ecosystem-tab-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="ecosystem-tab-copy">
                    <span className="ecosystem-tab-name ecosystem-serif">
                      {role.name}
                    </span>
                    <span className="ecosystem-tab-subtitle">
                      {role.subtitle}
                    </span>
                  </span>
                  <span className="ecosystem-tab-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className="ecosystem-card"
            id="ecosystem-panel"
            role="tabpanel"
            aria-labelledby={`ecosystem-tab-${activeIndex}`}
          >
            <div className="ecosystem-card-content" key={activeRole.name}>
              <div className="ecosystem-card-body">
                <p className="ecosystem-card-lead ecosystem-serif">
                  {activeRole.lead}
                </p>

                <ol className="ecosystem-steps">
                  {activeRole.steps.map((step, index) => (
                    <li className="ecosystem-step" key={step}>
                      <span className="ecosystem-step-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="ecosystem-card-foot">
                  <p className="ecosystem-card-note">{activeRole.note}</p>
                  <Link className="ecosystem-card-cta" to={activeRole.href}>
                    {activeRole.cta}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
