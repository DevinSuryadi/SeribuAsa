import type { CSSProperties } from "react";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useStaggerChildren } from "../../hooks/useStaggerChildren";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import donatur from "@/assets/role-donatur.svg";
import penerima from "@/assets/role-penerima.svg";
import vendor from "@/assets/role-vendor.svg";

const roles = [
  {
    image: donatur,
    title: "Donatur",
    subtitle: "Penyumbang Dana & Dukungan",
    desc: [
      "Individu, korporasi, atau lembaga yang menyumbangkan dana untuk program nutrisi melalui sistem e-voucher yang transparan untuk keluarga rentan.",
    ],
    iconColor: "#15803d",
    borderColor: "#b8d7bd",
    registerHref: "/register?role=donor",
  },
  {
    image: penerima,
    title: "Penerima Manfaat",
    subtitle: "Keluarga Rentan & Anak Usia Dini",
    desc: [
      "Keluarga dengan anak usia 1000 hari pertama yang membutuhkan dukungan nutrisi.",
      "Prioritas bantuan ditentukan berdasarkan skor FIES untuk memastikan yang paling rentan mendapat bantuan terlebih dahulu.",
    ],
    iconColor: "#2563eb",
    borderColor: "#9ec5ff",
    registerHref: "/register?role=beneficiary",
  },
  {
    image: vendor,
    title: "Mitra Vendor",
    subtitle: "Penyedia Bahan Pangan Bergizi",
    desc: [
      "Toko kelontong, tukang sayur, atau UMKM pangan terverifikasi yang menerima e-voucher sebagai alat pembayaran.",
      "Vendor menjual bahan pangan bergizi sesuai katalog yang telah disetujui sistem.",
    ],
    iconColor: "#6d28d9",
    borderColor: "#d6b7ef",
    registerHref: "/register?role=vendor",
  },
];

export function RolesSection() {
  const titleRef = useScrollReveal({ y: 24 });
  const timelineRef = useStaggerChildren({ stagger: 0.12, y: 28 });

  return (
    <section className="roles-section">
      <style>
        {`
          .roles-section,
          .roles-section * {
            box-sizing: border-box;
          }

          .roles-section {
            position: relative;
            overflow: hidden;
            background:
              radial-gradient(circle at 50% 0%, rgba(255, 250, 242, 0.98) 0%, #fbf6ec 100%);
            padding: clamp(38px, 6vw, 56px) 0 clamp(48px, 7vw, 70px);
          }

          .roles-container {
            position: relative;
            z-index: 2;
            width: 100%;
            max-width: 1120px;
            margin: 0 auto;
            padding-inline: clamp(18px, 5vw, 32px);
          }

          .roles-title-wrap {
            text-align: center;
            margin-bottom: clamp(26px, 5vw, 42px);
          }

          .roles-title {
            font-family: Georgia, "Times New Roman", serif;
            font-size: clamp(30px, 5vw, 46px);
            line-height: 1.04;
            font-weight: 800;
            color: #0d1726;
            letter-spacing: -1.2px;
            margin: 0;
            text-wrap: balance;
          }

          .roles-subtitle {
            margin: 12px auto 0;
            font-size: clamp(13px, 1.5vw, 14.8px);
            color: #5f6f82;
            max-width: 760px;
            line-height: 1.65;
            text-wrap: balance;
          }

          .roles-stage {
            position: relative;
            width: 100%;
            max-width: 1040px;
            margin: 0 auto;
          }

          .roles-road {
            position: absolute;
            left: 50%;
            top: 48%;
            width: 100vw;
            min-width: 1360px;
            height: 230px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 0;
            opacity: 0.9;
          }

          .roles-road-main {
            fill: none;
            stroke: #f1dec0;
            stroke-width: 52;
            stroke-linecap: round;
            stroke-linejoin: round;
            filter: drop-shadow(0 7px 12px rgba(105, 75, 35, 0.09));
          }

          .roles-road-edge {
            fill: none;
            stroke: rgba(255, 255, 255, 0.72);
            stroke-width: 60;
            stroke-linecap: round;
            stroke-linejoin: round;
            opacity: 0.55;
          }

          .roles-road-dash {
            fill: none;
            stroke: rgba(255, 255, 255, 0.92);
            stroke-width: 4.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 16 20;
          }

          .roles-card-wrap {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: clamp(22px, 3vw, 42px);
            width: 100%;
            padding-top: 54px;
            align-items: stretch;
          }

          .role-card {
            position: relative;
            width: 100%;
            min-width: 0;
            min-height: 318px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            border-radius: 24px;
            background: rgba(255, 255, 255, 0.97);
            border: 1.2px solid var(--role-border);
            box-shadow:
              0 14px 28px rgba(22, 30, 38, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.95);
            padding: 50px clamp(18px, 2vw, 22px) 20px;
            text-decoration: none;
            color: inherit;
            overflow: visible;
            transition:
              transform 0.22s ease,
              box-shadow 0.22s ease,
              border-color 0.22s ease;
          }

          .role-card:hover {
            transform: translateY(-5px);
            box-shadow:
              0 18px 34px rgba(22, 30, 38, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.95);
          }

          .role-avatar {
            position: absolute;
            top: -42px;
            left: 50%;
            transform: translateX(-50%);
            width: 92px;
            height: 92px;
            border-radius: 999px;
            background: #ffffff;
            border: 6px solid rgba(255, 255, 255, 0.96);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow:
              0 12px 24px rgba(22, 30, 38, 0.13),
              0 0 0 1px rgba(120, 120, 120, 0.08);
            z-index: 4;
          }

          .role-avatar::before {
            content: "";
            position: absolute;
            inset: -8px;
            border-radius: inherit;
            border: 1.5px dashed var(--role-border);
            opacity: 0.7;
          }

          .role-image {
            position: relative;
            z-index: 2;
            width: 78px;
            height: 78px;
            object-fit: contain;
            display: block;
            border-radius: 999px;
          }

          .role-title,
          .role-subtitle,
          .role-divider,
          .role-desc,
          .role-link-hint {
            position: relative;
            z-index: 2;
          }

          .role-title-wrap {
            min-height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 8px;
          }

          .role-title {
            font-family: Georgia, "Times New Roman", serif;
            color: var(--role-color);
            font-size: clamp(22px, 2.2vw, 28px);
            line-height: 1.05;
            font-weight: 800;
            letter-spacing: -0.6px;
            margin: 0;
            text-wrap: balance;
            overflow-wrap: anywhere;
          }

          .role-subtitle {
            margin: 6px 0 0;
            color: #111827;
            font-size: clamp(11.4px, 1.15vw, 12.2px);
            line-height: 1.35;
            font-weight: 800;
            min-height: 34px;
            text-wrap: balance;
          }

          .role-divider {
            display: flex;
            align-items: center;
            gap: 10px;
            width: min(66%, 180px);
            margin: 12px auto 0;
            color: var(--role-color);
          }

          .role-divider::before,
          .role-divider::after {
            content: "";
            height: 1.2px;
            flex: 1;
            background: var(--role-border);
            opacity: 0.65;
          }

          .role-divider-dot {
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: var(--role-color);
            box-shadow: 0 0 0 4px rgba(22, 30, 38, 0.06);
          }

          .role-desc {
            margin: 14px 0 0;
            display: grid;
            gap: 7px;
            width: 100%;
            color: #334155;
            font-size: clamp(11.3px, 1.08vw, 11.8px);
            line-height: 1.58;
            text-align: left;
            overflow-wrap: anywhere;
          }

          .role-desc p {
            margin: 0;
          }

          .role-link-hint {
            display: inline-flex;
            align-items: center;
            align-self: flex-start;
            gap: 8px;
            margin-top: auto;
            padding-top: 14px;
            color: var(--role-color);
            font-size: 11.7px;
            font-weight: 900;
            white-space: nowrap;
          }

          .role-arrow {
            flex: 0 0 auto;
            transition: transform 0.22s ease;
          }

          .role-card:hover .role-arrow {
            transform: translateX(4px);
          }

          @media (max-width: 980px) {
            .roles-container {
              max-width: 620px;
            }

            .roles-card-wrap {
              grid-template-columns: 1fr;
              gap: 76px;
              max-width: 430px;
              margin-inline: auto;
              padding-top: 48px;
            }

            .roles-road {
              display: none;
            }

            .roles-stage::before {
              content: "";
              position: absolute;
              left: 50%;
              top: 18px;
              bottom: 18px;
              width: 14px;
              border-radius: 999px;
              background: #f1dec0;
              transform: translateX(-50%);
              z-index: 0;
              opacity: 0.75;
              box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.45);
            }

            .role-card {
              min-height: unset;
              padding: 54px 22px 22px;
            }

            .role-title-wrap {
              min-height: unset;
            }

            .role-subtitle {
              min-height: unset;
            }
          }

          @media (max-width: 640px) {
            .roles-section {
              padding: 38px 0 52px;
            }

            .roles-container {
              padding-inline: 18px;
            }

            .roles-title-wrap {
              margin-bottom: 26px;
            }

            .roles-title {
              font-size: clamp(28px, 9vw, 38px);
              letter-spacing: -0.9px;
            }

            .roles-subtitle {
              font-size: 13px;
              line-height: 1.58;
            }

            .roles-card-wrap {
              width: 100%;
              max-width: 380px;
              gap: 72px;
              padding-top: 44px;
            }

            .role-card {
              border-radius: 22px;
              padding: 52px 20px 20px;
            }

            .role-avatar {
              width: 82px;
              height: 82px;
              top: -38px;
              border-width: 5px;
            }

            .role-avatar::before {
              inset: -7px;
            }

            .role-image {
              width: 70px;
              height: 70px;
            }

            .role-title {
              font-size: clamp(23px, 7vw, 27px);
            }

            .role-subtitle {
              font-size: 11.5px;
            }

            .role-desc {
              font-size: 11.2px;
              line-height: 1.56;
            }
          }

          @media (max-width: 380px) {
            .roles-container {
              padding-inline: 14px;
            }

            .roles-card-wrap {
              max-width: 100%;
              gap: 68px;
            }

            .role-card {
              padding: 50px 16px 18px;
              border-radius: 20px;
            }

            .role-avatar {
              width: 78px;
              height: 78px;
              top: -36px;
            }

            .role-image {
              width: 66px;
              height: 66px;
            }

            .role-link-hint {
              font-size: 11.2px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .role-card,
            .role-arrow {
              transition: none;
            }

            .role-card:hover {
              transform: none;
            }
          }
        `}
      </style>

      <div className="roles-container">
        <div ref={titleRef} className="roles-title-wrap">
          <h2 className="roles-title">Peran dalam Ekosistem SeribuAsa</h2>

          <p className="roles-subtitle">
            Tiga pilar utama yang saling terhubung menciptakan ekosistem
            ketahanan pangan yang berkelanjutan.
          </p>
        </div>

        <div className="roles-stage">
          <svg
            className="roles-road"
            viewBox="0 0 1600 330"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              className="roles-road-edge"
              d="M -80 72 C 30 72, 34 190, 152 208 C 286 228, 356 174, 470 178 C 588 182, 612 248, 720 250 C 846 252, 850 176, 970 176 C 1086 176, 1094 250, 1208 250 C 1344 250, 1348 170, 1482 160 C 1570 154, 1630 188, 1680 218"
            />
            <path
              className="roles-road-main"
              d="M -80 72 C 30 72, 34 190, 152 208 C 286 228, 356 174, 470 178 C 588 182, 612 248, 720 250 C 846 252, 850 176, 970 176 C 1086 176, 1094 250, 1208 250 C 1344 250, 1348 170, 1482 160 C 1570 154, 1630 188, 1680 218"
            />
            <path
              className="roles-road-dash"
              d="M -80 72 C 30 72, 34 190, 152 208 C 286 228, 356 174, 470 178 C 588 182, 612 248, 720 250 C 846 252, 850 176, 970 176 C 1086 176, 1094 250, 1208 250 C 1344 250, 1348 170, 1482 160 C 1570 154, 1630 188, 1680 218"
            />
          </svg>

          <div ref={timelineRef} className="roles-card-wrap">
            {roles.map((role) => (
              <Link
                key={role.title}
                to={role.registerHref}
                className="role-card"
                style={
                  {
                    "--role-color": role.iconColor,
                    "--role-border": role.borderColor,
                  } as CSSProperties
                }
              >
                <div className="role-avatar">
                  <img
                    src={role.image}
                    alt={role.title}
                    className="role-image"
                    loading="lazy"
                  />
                </div>

                <div className="role-title-wrap">
                  <h3 className="role-title">{role.title}</h3>
                </div>

                <p className="role-subtitle">{role.subtitle}</p>

                <div className="role-divider">
                  <span className="role-divider-dot" />
                </div>

                <div className="role-desc">
                  {role.desc.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>

                <div className="role-link-hint">
                  Klik untuk mendaftar
                  <ArrowRight
                    className="role-arrow"
                    size={15}
                    strokeWidth={2.5}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}