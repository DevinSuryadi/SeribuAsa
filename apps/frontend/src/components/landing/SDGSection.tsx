import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useStaggerChildren } from '../../hooks/useStaggerChildren';
import { Soup, ShieldCheck, BarChart3 } from 'lucide-react';
import sdgImage from '../../assets/sdg.svg';

const sdgs = [
  {
    title: 'SDG 2: Zero Hunger',
    desc: 'Menghapus kelaparan dan memastikan akses pangan bergizi bagi semua, terutama keluarga rentan yang membutuhkan dukungan nutrisi berkelanjutan.',
    points: [
      {
        icon: Soup,
        title: 'Akses Nutrisi',
        desc: 'Voucher pangan bergizi.',
      },
      {
        icon: ShieldCheck,
        title: 'Ketahanan Pangan',
        desc: 'Diukur melalui FIES.',
      },
      {
        icon: BarChart3,
        title: 'Dampak Terukur',
        desc: 'Pertumbuhan dipantau.',
      },
    ],
  },
];

export function SDGSection() {
  const titleRef = useScrollReveal({ y: 28 });
  const cardRef = useStaggerChildren({ stagger: 0.12, y: 24 });

  return (
    <section className="sdg-section">
      <style>
        {`
          .sdg-section {
            position: relative;
            overflow: hidden;
            background: #f8f4eb;
            padding: clamp(68px, 9vh, 96px) 0;
          }

          .sdg-section::before {
            content: "";
            position: absolute;
            left: -86px;
            top: -92px;
            width: 250px;
            height: 250px;
            border-radius: 999px;
            border: 1px solid rgba(221, 205, 174, 0.55);
            background: rgba(255, 255, 255, 0.22);
            pointer-events: none;
          }

          .sdg-section::after {
            content: "";
            position: absolute;
            right: -120px;
            bottom: -120px;
            width: 310px;
            height: 310px;
            border-radius: 999px;
            border: 1px solid rgba(221, 205, 174, 0.45);
            background: rgba(255, 250, 241, 0.35);
            pointer-events: none;
          }

          .sdg-bg-dots-top {
            position: absolute;
            top: 26px;
            left: 42%;
            width: 170px;
            height: 104px;
            background-image: radial-gradient(rgba(210, 163, 38, 0.34) 1.2px, transparent 1.2px);
            background-size: 18px 18px;
            opacity: 0.42;
            pointer-events: none;
          }

          .sdg-bg-dots-bottom {
            position: absolute;
            left: 24px;
            bottom: 70px;
            width: 156px;
            height: 88px;
            background-image: radial-gradient(rgba(210, 163, 38, 0.3) 1.2px, transparent 1.2px);
            background-size: 18px 18px;
            opacity: 0.38;
            pointer-events: none;
          }

          .sdg-bg-wave {
            position: absolute;
            left: -36px;
            bottom: -20px;
            width: 500px;
            height: 150px;
            opacity: 0.3;
            background:
              repeating-radial-gradient(
                circle at 35% 100%,
                transparent 0 13px,
                rgba(226, 211, 181, 0.68) 13px 14px
              );
            mask-image: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0));
            -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0));
            pointer-events: none;
          }

          .sdg-container {
            position: relative;
            z-index: 2;
            max-width: 1320px;
            margin: 0 auto;
            padding: 0 clamp(12px, 2vw, 20px);
          }

          .sdg-grid {
            display: grid;
            grid-template-columns: minmax(390px, 1fr) minmax(420px, 500px);
            gap: clamp(36px, 5vw, 64px);
            align-items: center;
          }

          .sdg-left {
            justify-self: start;
            max-width: 580px;
            margin-left: -44px;
          }

          .sdg-left-accent {
            width: 74px;
            height: 4px;
            border-radius: 999px;
            background: #d2a326;
            margin-bottom: 22px;
          }

          .sdg-title {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            font-size: clamp(38px, 4.2vw, 56px);
            line-height: 0.95;
            letter-spacing: -1.2px;
            color: #154632;
            font-weight: 700;
            max-width: 560px;
          }

          .sdg-copy {
            margin: 24px 0 0;
            max-width: 490px;
            color: #586d61;
            font-size: 15px;
            line-height: 1.9;
          }

          .sdg-right {
            justify-self: end;
            width: 100%;
            max-width: 500px;
          }

          .sdg-card-shell {
            position: relative;
            border-radius: 30px;
            padding: 14px;
            background: rgba(255, 250, 241, 0.78);
            border: 1px solid rgba(229, 218, 198, 0.75);
            box-shadow:
              0 18px 38px rgba(96, 78, 48, 0.07),
              inset 0 0 0 1px rgba(255, 255, 255, 0.52);
          }

          .sdg-card {
            position: relative;
            overflow: hidden;
            border-radius: 24px;
            background: rgba(255, 253, 248, 0.96);
            border: 1px solid rgba(229, 218, 198, 0.88);
            padding: clamp(22px, 3vw, 30px);
            box-shadow: 0 10px 24px rgba(89, 72, 45, 0.05);
          }

          .sdg-card::before {
            content: "";
            position: absolute;
            right: -38px;
            top: -38px;
            width: 120px;
            height: 120px;
            border-radius: 999px;
            background: rgba(219, 227, 210, 0.24);
            pointer-events: none;
          }

          .sdg-card-top {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 18px;
          }

.sdg-main-icon-wrap {
  width: 66px;
  height: 66px;
  border-radius: 16px;
  background: #fff8ea;
  border: 1px solid rgba(226, 204, 164, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(132, 99, 34, 0.08);
  overflow: hidden;
  flex-shrink: 0;
}

.sdg-main-image {
  width: 56px;
  height: 56px;
  object-fit: contain;
  display: block;
  border-radius: 12px;
}

          .sdg-badge {
            position: relative;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 8px 14px;
            border-radius: 999px;
            background: #dbe3d2;
            color: #22563f;
            font-size: 11.5px;
            font-weight: 850;
            letter-spacing: 0.2px;
            box-shadow: inset 0 0 0 1px rgba(34, 86, 63, 0.06);
            flex-shrink: 0;
          }

          .sdg-card-title {
            position: relative;
            z-index: 2;
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            color: #16503a;
            font-size: clamp(26px, 2.3vw, 34px);
            line-height: 1.1;
            letter-spacing: -0.6px;
            font-weight: 700;
            max-width: 380px;
          }

          .sdg-card-accent {
            position: relative;
            z-index: 2;
            width: 42px;
            height: 4px;
            border-radius: 999px;
            background: #d2a326;
            margin: 12px 0 16px;
          }

          .sdg-card-desc {
            position: relative;
            z-index: 2;
            margin: 0;
            max-width: 410px;
            color: #586d61;
            font-size: 13.5px;
            line-height: 1.82;
          }

          .sdg-points {
            position: relative;
            z-index: 2;
            display: grid;
            gap: 10px;
            margin-top: 22px;
          }

          .sdg-point {
            display: grid;
            grid-template-columns: 68px 1fr auto;
            align-items: center;
            min-height: 68px;
            border-radius: 18px;
            background: #fbf8f0;
            border: 1px solid rgba(222, 211, 190, 0.95);
            overflow: hidden;
            transition:
              transform 0.22s ease,
              box-shadow 0.22s ease,
              border-color 0.22s ease;
          }

          .sdg-point:hover {
            transform: translateX(4px);
            box-shadow: 0 10px 20px rgba(96, 78, 48, 0.05);
            border-color: rgba(210, 163, 38, 0.24);
          }

          .sdg-point-icon-col {
            align-self: stretch;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #e2e8d7;
            border-right: 1px solid rgba(222, 211, 190, 0.82);
          }

          .sdg-point-icon-wrap {
            width: 38px;
            height: 38px;
            border-radius: 999px;
            background: rgba(255,255,255,0.74);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 0 0 1px rgba(34, 86, 63, 0.05);
          }

          .sdg-point-icon {
            width: 19px;
            height: 19px;
            color: #0f5d3a;
            stroke-width: 2.15;
          }

          .sdg-point-copy {
            padding: 10px 12px 10px 14px;
          }

          .sdg-point-title {
            display: block;
            color: #184d38;
            font-size: 13.5px;
            font-weight: 850;
            line-height: 1.35;
          }

          .sdg-point-desc {
            display: block;
            margin-top: 3px;
            color: #687b70;
            font-size: 12px;
            line-height: 1.5;
          }

          .sdg-point-tail {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 14px 0 4px;
          }

          .sdg-point-tail::before {
            content: "";
            width: 16px;
            height: 1.5px;
            border-radius: 999px;
            background: rgba(210, 163, 38, 0.48);
          }

          .sdg-point-tail::after {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: #d2a326;
          }

          @media (max-width: 980px) {
            .sdg-grid {
              grid-template-columns: 1fr;
              gap: 40px;
            }

            .sdg-left {
              max-width: 680px;
              margin-left: 0;
            }

            .sdg-right {
              justify-self: start;
              max-width: 520px;
            }

            .sdg-bg-dots-top {
              left: auto;
              right: 8%;
            }
          }

          @media (max-width: 640px) {
            .sdg-section {
              padding: 56px 0 72px;
            }

            .sdg-title {
              font-size: clamp(34px, 11vw, 48px);
              line-height: 0.98;
            }

            .sdg-copy {
              font-size: 14px;
              line-height: 1.8;
            }

            .sdg-bg-dots-top,
            .sdg-bg-dots-bottom,
            .sdg-bg-wave {
              display: none;
            }

            .sdg-card-shell {
              padding: 10px;
              border-radius: 24px;
            }

            .sdg-card {
              border-radius: 20px;
              padding: 20px 18px;
            }

            .sdg-card-title {
              font-size: 25px;
            }

            .sdg-card-desc {
              font-size: 13px;
            }

            .sdg-point {
              grid-template-columns: 60px 1fr;
            }

            .sdg-point-tail {
              display: none;
            }
          }
        `}
      </style>

      <div className="sdg-bg-dots-top" />
      <div className="sdg-bg-dots-bottom" />
      <div className="sdg-bg-wave" />

      <div className="sdg-container">
        <div className="sdg-grid">
          <div ref={titleRef} className="sdg-left">
            <div className="sdg-left-accent" />

            <h2 className="sdg-title">
              Sejalan dengan
              <br />
              Tujuan Pembangunan
              <br />
              Berkelanjutan
            </h2>

            <p className="sdg-copy">
              SeribuAsa berkontribusi langsung pada pencapaian SDGs Indonesia
              melalui akses pangan bergizi, ketahanan pangan keluarga, dan
              pemantauan tumbuh kembang anak.
            </p>
          </div>

          <div ref={cardRef} className="sdg-right">
            {sdgs.map((sdg) => {
              return (
                <div key={sdg.title} className="sdg-card-shell">
                  <div className="sdg-card">
                    <div className="sdg-card-top">
                      <div className="sdg-main-icon-wrap">
                        <img
                          src={sdgImage}
                          alt="SDG icon"
                          className="sdg-main-image"
                        />
                      </div>
                    </div>

                    <h3 className="sdg-card-title">{sdg.title}</h3>
                    <div className="sdg-card-accent" />

                    <p className="sdg-card-desc">{sdg.desc}</p>

                    <div className="sdg-points">
                      {sdg.points.map((point) => {
                        const PointIcon = point.icon;

                        return (
                          <div key={point.title} className="sdg-point">
                            <div className="sdg-point-icon-col">
                              <div className="sdg-point-icon-wrap">
                                <PointIcon className="sdg-point-icon" />
                              </div>
                            </div>

                            <div className="sdg-point-copy">
                              <strong className="sdg-point-title">
                                {point.title}
                              </strong>
                              <span className="sdg-point-desc">
                                {point.desc}
                              </span>
                            </div>

                            <div className="sdg-point-tail" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}