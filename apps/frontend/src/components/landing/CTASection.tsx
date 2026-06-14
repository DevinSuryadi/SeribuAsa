import { Link } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { ArrowRight, Store, BarChart3 } from 'lucide-react';
import ctaBg from '../../assets/cta-bg.svg';

export function CTASection() {
  const ref = useScrollReveal({ y: 30 });

  return (
    <section
      className="cta-section"
      style={
        {
          '--cta-bg': `url(${ctaBg})`,
        } as React.CSSProperties
      }
    >
      <style>
        {`
          .cta-section {
            position: relative;
            overflow: hidden;
            background: #061a10;
            padding: clamp(110px, 14vh, 150px) 0 clamp(72px, 10vh, 110px);
          }

          /* foto background */
          .cta-section::after {
            content: "";
            position: absolute;
            inset: 0;
            background-image: var(--cta-bg);
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: 0;
            pointer-events: none;
            filter: saturate(0.85) contrast(1.05);
            transform: scale(1.02);
          }

          /* overlay hijau supaya foto jadi kehijauan */
          .cta-photo-overlay {
            position: absolute;
            inset: 0;
            background:
              linear-gradient(
                180deg,
                rgba(6, 26, 16, 0.78) 0%,
                rgba(6, 26, 16, 0.82) 45%,
                rgba(6, 26, 16, 0.88) 100%
              ),
              rgba(28, 91, 54, 0.42);
            mix-blend-mode: multiply;
            z-index: 1;
            pointer-events: none;
          }

          /* bentuk U cream di atas */
          .cta-curve {
            position: absolute;
            left: -5%;
            right: -5%;
            top: -1px;
            height: 120px;
            background: #f8f4eb;
            clip-path: ellipse(58% 70% at 50% 0%);
            z-index: 3;
            pointer-events: none;
          }

          .cta-container {
            position: relative;
            z-index: 4;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 clamp(16px, 5vw, 24px);
          }

          .cta-card {
            max-width: 760px;
            margin: 36px auto 0;
            border-radius: 28px;
            border: 1px solid rgba(248, 244, 235, 0.18);
            background: rgba(248, 244, 235, 0.96);
            padding: clamp(30px, 5vw, 48px) clamp(20px, 4vw, 34px);
            text-align: center;
            box-shadow:
              0 24px 54px rgba(0, 0, 0, 0.24),
              inset 0 0 0 1px rgba(255, 255, 255, 0.52);
            backdrop-filter: blur(2px);
          }

          .cta-title {
            font-family: Georgia, "Times New Roman", serif;
            font-size: clamp(30px, 4vw, 48px);
            line-height: 0.98;
            font-weight: 700;
            color: #154632;
            letter-spacing: -1px;
            margin: 0;
          }

          .cta-desc {
            max-width: 470px;
            margin: 16px auto 0;
            font-size: 15px;
            color: #586d61;
            line-height: 1.75;
          }

          .cta-actions {
            margin-top: 32px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }

          .cta-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: clamp(190px, 100%, 240px);
            padding: 12px 20px;
            border-radius: 999px;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease,
              background 0.2s ease,
              border-color 0.2s ease,
              color 0.2s ease;
          }

          .cta-button-primary {
            color: #ffffff;
            background: #2f6f46;
            box-shadow: 0 10px 24px rgba(47, 111, 70, 0.24);
          }

          .cta-button-primary:hover {
            transform: translateY(-2px);
            background: #265f3b;
            box-shadow: 0 14px 30px rgba(47, 111, 70, 0.30);
          }

          .cta-button-outline {
            color: #2f513e;
            border: 1px solid rgba(47, 111, 70, 0.18);
            background: rgba(47, 111, 70, 0.05);
          }

          .cta-button-outline:hover {
            transform: translateY(-2px);
            border-color: rgba(47, 111, 70, 0.28);
            background: rgba(47, 111, 70, 0.09);
          }

          .cta-button-ghost {
            color: #53675d;
            background: transparent;
            width: auto;
            min-width: unset;
            padding: 8px 10px;
          }

          .cta-button-ghost:hover {
            transform: translateY(-2px);
            color: #154632;
            background: rgba(47, 111, 70, 0.06);
          }

          @media (max-width: 640px) {
            .cta-section {
              padding: 96px 0 74px;
            }

            .cta-curve {
              height: 86px;
              clip-path: ellipse(78% 68% at 50% 0%);
            }

            .cta-card {
              max-width: 100%;
              border-radius: 22px;
              padding: 36px 18px 36px;
            }

            .cta-title {
              font-size: clamp(32px, 11vw, 42px);
            }

            .cta-desc {
              font-size: 14px;
            }

            .cta-actions {
              flex-direction: column;
              gap: 10px;
            }

            .cta-button {
              width: min(100%, 240px);
            }

            .cta-button-ghost {
              width: auto;
            }
          }
        `}
      </style>

      <div className="cta-photo-overlay" />
      <div className="cta-curve" />

      <div className="cta-container">
        <div ref={ref} className="cta-card">
          <h2 className="cta-title">
            Bergabunglah dalam Misi Nutrisi Indonesia
          </h2>

          <p className="cta-desc">
            Jadilah bagian dari ekosistem yang memastikan setiap keluarga
            mendapat akses pangan bergizi.
          </p>

          <div className="cta-actions">
            <Link to="/donasi" className="cta-button cta-button-primary">
              Mulai Donasi
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/register?role=vendor"
              className="cta-button cta-button-outline"
            >
              <Store size={16} />
              Daftar Vendor
            </Link>

            <Link to="/dampak" className="cta-button cta-button-ghost">
              <BarChart3 size={16} />
              Lihat Dampak
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}