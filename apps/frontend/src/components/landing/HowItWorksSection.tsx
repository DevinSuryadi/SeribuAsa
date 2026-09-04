import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useStaggerChildren } from "../../hooks/useStaggerChildren";

const steps = [
  {
    number: "1",
    title: "Donatur Berdonasi",
    desc: "Donatur memilih paket donasi nutrisi bulanan atau donasi sekali untuk mendukung keluarga rentan.",
  },
  {
    number: "2",
    title: "Verifikasi & Alokasi",
    desc: "Data penerima diverifikasi, skor FIES dihitung, dan voucher dialokasikan secara adil berdasarkan kebutuhan.",
  },
  {
    number: "3",
    title: "Belanja Pangan Bergizi",
    desc: "Penerima menggunakan e-voucher untuk membeli bahan pangan bergizi di mitra vendor terverifikasi.",
  },
  {
    number: "4",
    title: "Pantau Dampak",
    desc: "Pertumbuhan anak dipantau, skor ketahanan pangan diukur, dan dampak dilaporkan secara transparan.",
  },
];

export function HowItWorksSection() {
  const titleRef = useScrollReveal({ y: 24 });
  const timelineRef = useStaggerChildren({ stagger: 0.14, y: 28 });
  const sectionRef = useRef<HTMLElement | null>(null);

  const [progress, setProgress] = useState(0);
  const [clickedStep, setClickedStep] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const start = windowHeight * 0.78;
      const end = rect.height * 0.18;

      let next = 0;

      if (rect.top <= start) {
        const traveled = start - rect.top;
        const total = rect.height - end;
        next = Math.min(Math.max(traveled / total, 0), 1);
      }

      setProgress(next);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollActiveIndex =
    progress <= 0
      ? -1
      : Math.min(steps.length - 1, Math.floor(progress * steps.length));

  const activeIndex = clickedStep !== null ? clickedStep : scrollActiveIndex;

  const lineProgress =
    clickedStep !== null
      ? clickedStep === 0
        ? 0
        : (clickedStep / (steps.length - 1)) * 100
      : progress * 100;

  return (
    <section
      ref={sectionRef}
      className="how-section"
      style={
        {
          "--line-progress": `${lineProgress}%`,
        } as CSSProperties
      }
    >
      <style>
        {`
          .how-section,
          .how-section * {
            box-sizing: border-box;
          }

          .how-section {
            position: relative;
            overflow: hidden;
            background:
              radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.26) 0%, transparent 44%),
              linear-gradient(180deg, #dfe8d9 0%, #e7ede1 52%, #dfe8d9 100%);
            padding: clamp(86px, 10vh, 116px) 0 clamp(94px, 11vh, 128px);
          }

          .how-wave {
            position: absolute;
            left: 0;
            width: 100%;
            pointer-events: none;
            z-index: 0;
          }

          .how-wave svg {
            display: block;
            width: 100%;
            height: 100%;
          }

          .how-wave-top {
            top: -1px;
            height: clamp(78px, 9vw, 120px);
          }

          .how-wave-bottom {
            bottom: -1px;
            height: clamp(82px, 9.5vw, 126px);
          }

          .how-container {
            position: relative;
            z-index: 2;
            max-width: 1050px;
            margin: 0 auto;
            padding: 0 clamp(18px, 5vw, 28px);
          }

          .how-title-wrap {
            text-align: center;
            margin-bottom: clamp(48px, 7vw, 72px);
          }

          .how-title {
            font-family: Georgia, "Times New Roman", serif;
            font-size: clamp(34px, 4.8vw, 54px);
            line-height: 1;
            font-weight: 800;
            color: #173b2a;
            letter-spacing: -1.4px;
            margin: 0;
            text-wrap: balance;
          }

          .how-subtitle {
            margin: 16px auto 0;
            max-width: 700px;
            color: #3f5b49;
            font-size: 15px;
            line-height: 1.65;
            text-wrap: balance;
          }

          .timeline {
            position: relative;
            max-width: 920px;
            margin: 0 auto;
            display: grid;
            gap: 50px;
          }

          .timeline-line {
            position: absolute;
            top: 22px;
            bottom: 22px;
            left: 50%;
            width: 3px;
            transform: translateX(-50%);
            background: rgba(52, 86, 63, 0.22);
            border-radius: 999px;
            overflow: hidden;
            z-index: 1;
          }

          .timeline-line::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: var(--line-progress);
            background: #4e7a5b;
            border-radius: inherit;
            transition: height 0.42s ease;
          }

          .timeline-item {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 76px minmax(0, 1fr);
            align-items: center;
            gap: 28px;
            cursor: pointer;
            z-index: 2;
            min-width: 0;
          }

          .timeline-item.timeline-left .timeline-content {
            grid-column: 1;
            text-align: right;
          }

          .timeline-item.timeline-right .timeline-content {
            grid-column: 3;
            text-align: left;
          }

          .timeline-marker {
            grid-column: 2;
            grid-row: 1;
            position: relative;
            z-index: 3;
            width: 48px;
            height: 48px;
            border-radius: 999px;
            background: #8fa794;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            justify-self: center;
            font-size: 14px;
            font-weight: 900;
            box-shadow:
              0 0 0 8px #dfe8d9,
              0 8px 18px rgba(23, 59, 42, 0.1);
            transition:
              background 0.25s ease,
              color 0.25s ease,
              transform 0.25s ease,
              box-shadow 0.25s ease;
          }

          .timeline-item.active .timeline-marker {
            background: #2f6f46;
            color: #ffffff;
            transform: scale(1.03);
            box-shadow:
              0 0 0 8px #dfe8d9,
              0 10px 20px rgba(23, 59, 42, 0.16);
          }

          .timeline-content {
            position: relative;
            z-index: 2;
            min-width: 0;
            padding: 0;
            background: transparent;
            box-shadow: none;
            border-radius: 0;
            transition:
              transform 0.22s ease,
              opacity 0.22s ease;
            opacity: 0.72;
          }

          .timeline-item.active .timeline-content {
            opacity: 1;
          }

          .timeline-item:hover .timeline-content {
            transform: translateY(-2px);
          }

          .timeline-title {
            margin: 0;
            color: #173b2a;
            font-size: 18px;
            line-height: 1.25;
            font-weight: 850;
            letter-spacing: -0.2px;
            overflow-wrap: anywhere;
          }

          .timeline-desc {
            margin: 10px 0 0;
            color: #466050;
            font-size: 14px;
            line-height: 1.75;
            overflow-wrap: anywhere;
          }

          @media (max-width: 820px) {
            .how-section {
              padding: 84px 0 92px;
            }

            .timeline {
              max-width: 560px;
              gap: 32px;
            }

            .timeline-line {
              left: 24px;
              top: 18px;
              bottom: 18px;
              transform: none;
            }

            .timeline-item,
            .timeline-item.timeline-left,
            .timeline-item.timeline-right {
              grid-template-columns: 48px minmax(0, 1fr);
              gap: 18px;
              align-items: start;
            }

            .timeline-marker {
              grid-column: 1;
              width: 40px;
              height: 40px;
              font-size: 13px;
              justify-self: start;
              box-shadow:
                0 0 0 8px #dfe8d9,
                0 8px 18px rgba(23, 59, 42, 0.1);
            }

            .timeline-item.active .timeline-marker {
              box-shadow:
                0 0 0 8px #dfe8d9,
                0 10px 18px rgba(23, 59, 42, 0.16);
            }

            .timeline-content,
            .timeline-item.timeline-left .timeline-content,
            .timeline-item.timeline-right .timeline-content {
              grid-column: 2;
              text-align: left;
            }

            .timeline-title {
              font-size: 17px;
            }

            .timeline-desc {
              font-size: 13.5px;
            }
          }

          @media (max-width: 640px) {
            .how-section {
              padding: 74px 0 82px;
            }

            .how-wave-top {
              height: 64px;
            }

            .how-wave-bottom {
              height: 70px;
            }

            .how-container {
              padding-inline: 18px;
            }

            .how-title-wrap {
              margin-bottom: 42px;
            }

            .how-title {
              font-size: clamp(28px, 10vw, 38px);
              letter-spacing: -1px;
            }

            .how-subtitle {
              font-size: 14px;
              line-height: 1.58;
            }

            .timeline {
              gap: 30px;
            }
          }

          @media (max-width: 380px) {
            .how-container {
              padding-inline: 14px;
            }

            .timeline {
              gap: 28px;
            }

            .timeline-line {
              left: 21px;
            }

            .timeline-item,
            .timeline-item.timeline-left,
            .timeline-item.timeline-right {
              grid-template-columns: 42px minmax(0, 1fr);
              gap: 14px;
            }

            .timeline-marker {
              width: 36px;
              height: 36px;
              font-size: 12px;
              box-shadow:
                0 0 0 7px #dfe8d9,
                0 8px 16px rgba(23, 59, 42, 0.1);
            }

            .timeline-item.active .timeline-marker {
              box-shadow:
                0 0 0 7px #dfe8d9,
                0 10px 16px rgba(23, 59, 42, 0.15);
            }

            .timeline-title {
              font-size: 15.8px;
            }

            .timeline-desc {
              font-size: 12.8px;
              line-height: 1.6;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .timeline-line::before,
            .timeline-marker,
            .timeline-content {
              transition: none;
            }

            .timeline-item:hover .timeline-content {
              transform: none;
            }
          }
        `}
      </style>

      <div className="how-wave how-wave-top" aria-hidden="true">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <rect width="1440" height="120" fill="#fbf6ec" />
          <path
            d="M0,58 C135,88 260,38 410,28 C585,16 710,76 892,58 C1055,42 1190,2 1440,48 L1440,120 L0,120 Z"
            fill="#dfe8d9"
          />
        </svg>
      </div>

      <div className="how-wave how-wave-bottom" aria-hidden="true">
        <svg viewBox="0 0 1440 126" preserveAspectRatio="none">
          <rect width="1440" height="126" fill="#fbf6ec" />
          <path
            d="M0,48 C145,18 268,72 426,82 C594,94 730,44 900,58 C1065,72 1205,116 1440,62 L1440,0 L0,0 Z"
            fill="#dfe8d9"
          />
        </svg>
      </div>

      <div className="how-container">
        <div ref={titleRef} className="how-title-wrap">
          <h2 className="how-title">Cara Kerja SeribuAsa</h2>
          <p className="how-subtitle">
            Dari donasi hingga nutrisi di meja makan, setiap langkah transparan
            dan terukur.
          </p>
        </div>

        <div ref={timelineRef} className="timeline">
          <div className="timeline-line" />

          {steps.map((step, index) => {
            const isActive = index <= activeIndex;

            return (
              <div
                key={step.number}
                className={`timeline-item ${
                  index % 2 === 0 ? "timeline-left" : "timeline-right"
                } ${isActive ? "active" : ""}`}
                onClick={() => setClickedStep(index)}
              >
                <div className="timeline-marker">{step.number}</div>

                <div className="timeline-content">
                  <h3 className="timeline-title">{step.title}</h3>
                  <p className="timeline-desc">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}