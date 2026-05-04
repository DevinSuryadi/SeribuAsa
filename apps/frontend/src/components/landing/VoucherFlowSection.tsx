import { useState, useEffect, useRef } from "react";
import {
  Heart, Users, Store, ShieldCheck,
  ArrowRight, Wallet, QrCode, Landmark, CheckCircle2,
  TrendingUp, Sparkles,
} from "lucide-react";

/* ─── Data ─────────────────────────────────────────────── */
const ROLES = [
  {
    id: "donor",
    label: "Donatur",
    sublabel: "Penyumbang Dana",
    Icon: Heart,
    color: "#16a34a",
    bg: "rgba(22,163,74,0.08)",
    border: "rgba(22,163,74,0.25)",
    glow: "0 0 32px rgba(22,163,74,0.18)",
    steps: ["Daftar sebagai donatur", "Pilih jumlah & kategori donasi", "Konfirmasi melalui payment gateway"],
  },
  {
    id: "admin",
    label: "Admin / Sistem",
    sublabel: "Pengelola Platform",
    Icon: ShieldCheck,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.25)",
    glow: "0 0 32px rgba(124,58,237,0.18)",
    steps: ["Terima & validasi donasi", "Hitung alokasi per penerima", "Generate e-voucher + kirim"],
  },
  {
    id: "beneficiary",
    label: "Penerima",
    sublabel: "Keluarga Penerima Manfaat",
    Icon: Users,
    color: "#2563eb",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.25)",
    glow: "0 0 32px rgba(37,99,235,0.18)",
    steps: ["Terima e-voucher di Dompet Nutrisi", "Pilih produk di katalog pangan", "Bayar dengan scan QR voucher"],
  },
  {
    id: "vendor",
    label: "Vendor",
    sublabel: "Mitra Penyedia Pangan",
    Icon: Store,
    color: "#d97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.25)",
    glow: "0 0 32px rgba(217,119,6,0.18)",
    steps: ["Scan / terima kode voucher", "Konfirmasi nominal transaksi", "Dana masuk ke saldo vendor"],
  },
];

const ARROWS = [
  {
    from: "donor",
    to: "admin",
    label: "Donasi Dana",
    sublabel: "Via payment gateway",
    Icon: Heart,
    color: "#16a34a",
    bg: "rgba(22,163,74,0.1)",
  },
  {
    from: "admin",
    to: "beneficiary",
    label: "Distribusi Voucher",
    sublabel: "E-voucher terenkripsi",
    Icon: Wallet,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.1)",
  },
  {
    from: "beneficiary",
    to: "vendor",
    label: "Penukaran Voucher",
    sublabel: "Scan QR di toko mitra",
    Icon: QrCode,
    color: "#2563eb",
    bg: "rgba(37,99,235,0.1)",
  },
];

const SETTLEMENT_STEPS = [
  { Icon: CheckCircle2, label: "Vendor konfirmasi transaksi", color: "#d97706" },
  { Icon: Landmark,    label: "Admin proses settlement",     color: "#7c3aed" },
  { Icon: TrendingUp,  label: "Dana masuk rekening vendor",  color: "#16a34a" },
];

/* ─── useInView hook ────────────────────────────────────── */
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Arrow connector ───────────────────────────────────── */
function FlowArrow({ label, sublabel, Icon, color, bg, index, visible }: {
  label: string; sublabel: string; Icon: React.ElementType;
  color: string; bg: string; index: number; visible: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 flex-shrink-0"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(12px)",
        transition: `opacity 0.5s ease ${0.15 + index * 0.15}s, transform 0.5s ease ${0.15 + index * 0.15}s`,
      }}
    >
      {/* Arrow line */}
      <div className="hidden lg:flex items-center gap-0 w-24 xl:w-32">
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color})` }} />
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: bg, border: `1px solid ${color}40` }}
        >
          <ArrowRight className="h-3 w-3" style={{ color }} />
        </div>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      </div>

      {/* Label pill */}
      <div
        className="rounded-full px-2.5 py-1 flex items-center gap-1.5 flex-shrink-0"
        style={{ background: bg, border: `1px solid ${color}30` }}
      >
        <Icon className="h-2.5 w-2.5 flex-shrink-0" style={{ color }} />
        <div>
          <p className="text-[9px] font-bold leading-tight" style={{ color }}>{label}</p>
          <p className="text-[8px] text-gray-400 leading-tight">{sublabel}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Role Card ─────────────────────────────────────────── */
function RoleCard({ role, index, visible, active, onClick }: {
  role: typeof ROLES[0]; index: number; visible: boolean;
  active: boolean; onClick: () => void;
}) {
  const { Icon, label, sublabel, color, bg, border, glow, steps } = role;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center text-left w-full cursor-pointer group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(24px)",
        transition: `opacity 0.55s ease ${index * 0.13}s, transform 0.55s ease ${index * 0.13}s`,
      }}
    >
      <div
        className="rounded-2xl p-4 w-full transition-all duration-300"
        style={{
          background: active ? bg : "var(--background, #fff)",
          border: `1.5px solid ${active ? border : "rgba(0,0,0,0.07)"}`,
          boxShadow: active ? glow : "0 1px 4px rgba(0,0,0,0.04)",
          transform: active ? "translateY(-3px)" : "none",
        }}
      >
        {/* Icon + header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <Icon className="h-4.5 w-4.5" style={{ color }} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 leading-tight">{label}</p>
            <p className="text-[9px] text-gray-400 leading-tight">{sublabel}</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <div
                className="mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: active ? color : "#d1d5db" }}
              />
              <p className="text-[9px] text-gray-500 leading-snug">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}

/* ─── Main Section ──────────────────────────────────────── */
export function VoucherFlowSection() {
  const { ref, visible } = useInView(0.15);
  const [activeRole, setActiveRole] = useState<string | null>("beneficiary");

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "clamp(56px, 9vh, 96px) 0",
        background: "linear-gradient(180deg, rgba(124,58,237,0.03) 0%, rgba(255,255,255,0) 100%)",
      }}
    >
      {/* Background orbs */}
      <div style={{
        position: "absolute", top: "10%", left: "-5%", width: 320, height: 320,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.07), transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "-5%", width: 280, height: 280,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(22,163,74,0.07), transparent 65%)",
        pointerEvents: "none",
      }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div
          className="text-center mb-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4" style={{
            background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
          }}>
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700">Alur Distribusi Voucher</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
            Bagaimana Voucher Mengalir
            <span className="block" style={{ color: "#7c3aed" }}>Dari Donatur ke Penerima</span>
          </h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Klik tiap role untuk melihat detail prosesnya. Setiap voucher terenkripsi, terlacak, dan hanya bisa
            ditukar untuk produk pangan bergizi dari vendor terverifikasi.
          </p>
        </div>

        {/* ── Main flow: 4 roles + 3 arrows ── */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-0 mb-10">
          {ROLES.map((role, i) => (
            <div key={role.id} className="flex flex-col lg:flex-row items-center w-full lg:w-auto">
              {/* Role card */}
              <div className="w-full lg:w-44 xl:w-52">
                <RoleCard
                  role={role}
                  index={i}
                  visible={visible}
                  active={activeRole === role.id}
                  onClick={() => setActiveRole(prev => prev === role.id ? null : role.id)}
                />
              </div>

              {/* Arrow (between cards) */}
              {i < ARROWS.length && (
                <FlowArrow
                  {...ARROWS[i]}
                  index={i}
                  visible={visible}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Settlement loop ── */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(217,119,6,0.05) 0%, rgba(124,58,237,0.05) 100%)",
            border: "1px solid rgba(217,119,6,0.15)",
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : "translateY(20px)",
            transition: "opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s",
          }}
        >
          {/* Loop arrow visual */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <div
              className="rounded-full px-3 py-1 flex items-center gap-1.5"
              style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.3)" }}
            >
              <Landmark className="h-3 w-3 text-amber-600" />
              <span className="text-[9px] font-bold text-amber-700">Loop Settlement</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {SETTLEMENT_STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}
                  >
                    <s.Icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  <p className="text-[10px] font-semibold text-gray-700 max-w-[100px] leading-tight">{s.label}</p>
                </div>
                {i < SETTLEMENT_STEPS.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 hidden sm:block" />
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-[9px] text-gray-400 mt-3">
            Vendor → Konfirmasi → Admin Settlement → Dana ke Rekening Vendor
          </p>
        </div>

        {/* ── Legend / Key Stats ── */}
        <div
          className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease 0.55s",
          }}
        >
          {[
            { label: "100%",     desc: "Dana teraudit",          color: "#16a34a" },
            { label: "Realtime", desc: "Update saldo voucher",   color: "#2563eb" },
            { label: "AES-256",  desc: "Enkripsi voucher",       color: "#7c3aed" },
            { label: "T+1",      desc: "Settlement ke vendor",   color: "#d97706" },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl p-3 text-center"
              style={{ background: `${stat.color}08`, border: `1px solid ${stat.color}20` }}
            >
              <p className="text-base font-extrabold" style={{ color: stat.color }}>{stat.label}</p>
              <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
