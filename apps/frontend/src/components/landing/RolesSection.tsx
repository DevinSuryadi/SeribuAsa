import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useStaggerChildren } from "../../hooks/useStaggerChildren";
import { Heart, Users, Store, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const roles = [
  {
    icon: Heart,
    title: "Donatur",
    subtitle: "Penyumbang Dana & Dukungan",
    desc: "Individu, korporasi, atau lembaga yang menyumbangkan dana untuk program nutrisi. Donasi Anda dikelola transparan melalui sistem e-voucher yang tepat sasaran untuk keluarga rentan.",
    iconBg: "rgba(34,197,94,0.1)",
    iconColor: "#16a34a",
    registerHref: "/register?role=donor",
  },
  {
    icon: Users,
    title: "Penerima Manfaat",
    subtitle: "Keluarga Rentan & Anak Usia Dini",
    desc: "Keluarga dengan anak usia 1000 hari pertama yang membutuhkan dukungan nutrisi. Prioritas bantuan ditentukan berdasarkan skor FIES (Food Insecurity Experience Scale) untuk memastikan yang paling rentan mendapat bantuan terlebih dahulu.",
    iconBg: "rgba(37,99,235,0.1)",
    iconColor: "#2563eb",
    registerHref: "/register?role=beneficiary",
  },
  {
    icon: Store,
    title: "Mitra Vendor",
    subtitle: "Penyedia Bahan Pangan Bergizi",
    desc: "Toko kelontong, tukang sayur, atau UMKM pangan terverifikasi yang menerima e-voucher sebagai alat pembayaran. Vendor menjual bahan pangan bergizi sesuai katalog yang telah disetujui sistem.",
    iconBg: "rgba(147,51,234,0.1)",
    iconColor: "#9333ea",
    registerHref: "/register?role=vendor",
  },
];

export function RolesSection() {
  const titleRef = useScrollReveal({ y: 30 });
  const gridRef = useStaggerChildren({ stagger: 0.15, y: 40 });

  return (
    <section
      style={{ position: "relative", overflow: "hidden", padding: "clamp(48px, 8vh, 80px) 0" }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background: "linear-gradient(135deg, rgba(34,197,94,0.04) 0%, rgba(255,255,255,0) 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 20,
          width: "clamp(120px, 25vw, 256px)",
          height: "clamp(120px, 25vw, 256px)",
          borderRadius: "50%",
          background: "rgba(34,197,94,0.05)",
          filter: "blur(64px)",
          zIndex: -1,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 20,
          width: "clamp(150px, 30vw, 288px)",
          height: "clamp(150px, 30vw, 288px)",
          borderRadius: "50%",
          background: "rgba(37,99,235,0.05)",
          filter: "blur(64px)",
          zIndex: -1,
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px, 5vw, 24px)" }}>
        <div ref={titleRef} style={{ textAlign: "center", marginBottom: "clamp(32px, 6vw, 56px)" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            Peran dalam Ekosistem SeribuAsa
          </h2>
          <p
            style={{
              marginTop: 12,
              fontSize: 15,
              color: "#666",
              maxWidth: 700,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.6,
            }}
          >
            Tiga pilar utama yang saling terhubung menciptakan ekosistem ketahanan pangan yang
            berkelanjutan.
          </p>
        </div>

        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {roles.map((role, i) => (
            <Link
              key={role.title}
              to={role.registerHref}
              style={{
                position: "relative",
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
                padding: "32px 28px 28px",
                transition: "all 0.2s ease",
                cursor: "pointer",
                textDecoration: "none",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.09)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Role number badge */}
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  right: 20,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: role.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {i + 1}
              </div>

              {/* Icon */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  background: role.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <role.icon style={{ width: 28, height: 28, color: role.iconColor }} />
              </div>

              {/* Title & Subtitle */}
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", margin: 0 }}>
                {role.title}
              </h3>
              <p style={{ marginTop: 4, fontSize: 13, color: role.iconColor, fontWeight: 600 }}>
                {role.subtitle}
              </p>

              {/* Description */}
              <p style={{ marginTop: 12, fontSize: 14, color: "#555", lineHeight: 1.7 }}>
                {role.desc}
              </p>

              {/* Click hint */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 20,
                  fontSize: 14,
                  fontWeight: 600,
                  color: role.iconColor,
                }}
              >
                Klik untuk mendaftar
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
