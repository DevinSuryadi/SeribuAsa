import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useStaggerChildren } from '../../hooks/useStaggerChildren';
import { Star } from 'lucide-react';

import reviewPenerima from '@/assets/review-penerima.svg';
import reviewDonor from '@/assets/review-donor.svg';
import reviewDonorKorporat from '@/assets/review-donor-korporat.svg';

const testimonials = [
  {
    name: 'Ibu Sari Wulandari',
    role: 'Penerima Manfaat',
    title: 'Nutrisi Anak Lebih Terjaga',
    text: 'Dengan SeribuAsa, anak saya bisa mendapat telur, susu, dan sayuran segar setiap minggu. Gizinya jauh lebih baik sekarang.',
    image: reviewPenerima,
  },
  {
    name: 'Ahmad Fauzi',
    role: 'Donatur Individu',
    title: 'Donasi Jadi Lebih Transparan',
    text: 'Saya bisa melihat dampak donasi saya secara langsung. Transparan dan terpercaya, itu yang membuat saya terus berdonasi.',
    image: reviewDonor,
  },
  {
    name: 'PT Sejahtera Pangan',
    role: 'Donatur Korporat',
    title: 'Laporan Dampaknya Jelas',
    text: 'Program CSR kami melalui SeribuAsa memberikan laporan dampak yang jelas dan mudah dipahami untuk para stakeholder.',
    image: reviewDonorKorporat,
  },
];

export function TrustSection() {
  const titleRef = useScrollReveal({ y: 30 });
  const gridRef = useStaggerChildren({ stagger: 0.15 });

  return (
    <section className="trust-section">
      <style>
        {`
          .trust-section,
          .trust-section * {
            box-sizing: border-box;
          }

          .trust-section {
            position: relative;
            overflow: hidden;
            background: #f8f4eb;
            padding: clamp(64px, 9vh, 96px) 0;
          }

          .trust-green-shape-one,
          .trust-green-shape-two,
          .trust-green-shape-three {
            position: absolute;
            pointer-events: none;
            z-index: 0;
          }

          .trust-green-shape-one {
            left: -110px;
            top: 48px;
            width: 360px;
            height: 180px;
            background: rgba(47, 111, 70, 0.11);
            border: 1px solid rgba(47, 111, 70, 0.13);
            border-radius: 68% 32% 54% 46% / 42% 56% 44% 58%;
            transform: rotate(-14deg);
          }

          .trust-green-shape-two {
            right: -120px;
            bottom: 30px;
            width: 330px;
            height: 170px;
            background: rgba(47, 111, 70, 0.13);
            border: 1px solid rgba(47, 111, 70, 0.14);
            border-radius: 45% 55% 34% 66% / 52% 38% 62% 48%;
            transform: rotate(18deg);
          }

          .trust-green-shape-three {
            left: 44%;
            top: 26px;
            width: 190px;
            height: 90px;
            background: rgba(21, 70, 50, 0.07);
            border-radius: 61% 39% 67% 33% / 44% 61% 39% 56%;
            transform: rotate(8deg);
          }

          .trust-container {
            position: relative;
            z-index: 2;
            max-width: 1180px;
            margin: 0 auto;
            padding: 0 clamp(18px, 4vw, 34px);
          }

          .trust-title-wrap {
            text-align: center;
            margin-bottom: clamp(42px, 6vw, 58px);
          }

          .trust-title {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            font-size: clamp(36px, 4.4vw, 56px);
            line-height: 1;
            letter-spacing: -1.2px;
            color: #154632;
            font-weight: 700;
          }

          .trust-subtitle {
            margin: 14px auto 0;
            max-width: 520px;
            color: #586d61;
            font-size: 15px;
            line-height: 1.7;
          }

          .testimonial-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: clamp(20px, 3vw, 28px);
            max-width: 1040px;
            margin: 0 auto;
            align-items: start;
          }

          .testimonial-card {
            position: relative;
            min-height: 248px;
            border-radius: 26px;
            background: #ffffff;
            padding: 22px 22px 20px;
            border: 1px solid rgba(47, 111, 70, 0.12);
            box-shadow:
              0 18px 36px rgba(47, 111, 70, 0.10),
              0 2px 0 rgba(255, 255, 255, 0.9) inset;
            transform: rotate(-2deg);
            transition:
              transform 0.25s ease,
              box-shadow 0.25s ease;
          }

          .testimonial-card:nth-child(2) {
            transform: rotate(1.5deg) translateY(16px);
          }

          .testimonial-card:nth-child(3) {
            transform: rotate(-1.2deg);
          }

          .testimonial-card:hover {
            transform: rotate(0deg) translateY(-6px);
            box-shadow:
              0 24px 48px rgba(47, 111, 70, 0.15),
              0 2px 0 rgba(255, 255, 255, 0.9) inset;
          }

          .testimonial-card::before {
            content: "";
            position: absolute;
            inset: 9px;
            border-radius: 21px;
            border: 1px solid rgba(47, 111, 70, 0.045);
            pointer-events: none;
          }

          .testimonial-profile {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: 58px minmax(0, 1fr);
            gap: 13px;
            align-items: center;
            margin-bottom: 14px;
          }

          .testimonial-photo-wrap {
            width: 58px;
            height: 58px;
            border-radius: 999px;
            padding: 3px;
            background:
              linear-gradient(180deg, rgba(47, 111, 70, 0.22), rgba(47, 111, 70, 0.06)),
              #f8f4eb;
            box-shadow: 0 10px 20px rgba(47, 111, 70, 0.12);
            flex: 0 0 auto;
          }

          .testimonial-photo {
            width: 100%;
            height: 100%;
            display: block;
            border-radius: 999px;
            object-fit: cover;
            object-position: center;
            border: 2px solid #ffffff;
          }

          .testimonial-identity {
            min-width: 0;
          }

          .testimonial-name-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            min-width: 0;
          }

          .testimonial-name {
            margin: 0;
            color: #2563eb;
            font-size: 14.5px;
            line-height: 1.2;
            font-weight: 850;
            overflow-wrap: anywhere;
          }

          .testimonial-dots {
            display: flex;
            gap: 5px;
            flex: 0 0 auto;
            transform: translateY(1px);
          }

          .testimonial-dots span {
            width: 7px;
            height: 7px;
            border-radius: 999px;
            background: #d4d4d4;
          }

          .testimonial-stars {
            display: flex;
            gap: 3px;
            margin-top: 7px;
          }

          .testimonial-star {
            width: 14px;
            height: 14px;
            fill: #f59e0b;
            color: #f59e0b;
          }

          .testimonial-title {
            position: relative;
            z-index: 2;
            margin: 0;
            color: #151515;
            font-size: 18px;
            line-height: 1.16;
            font-weight: 900;
            letter-spacing: -0.3px;
          }

          .testimonial-text {
            position: relative;
            z-index: 2;
            margin: 10px 0 0;
            color: #3f4a43;
            font-size: 12.5px;
            line-height: 1.55;
          }

          .testimonial-footer {
            position: relative;
            z-index: 2;
            margin-top: 16px;
            padding-top: 13px;
            border-top: 1px solid rgba(47, 111, 70, 0.1);
          }

          .testimonial-role {
            color: #7f8c84;
            font-size: 11.5px;
            line-height: 1.4;
            font-weight: 600;
          }

          @media (max-width: 900px) {
            .testimonial-grid {
              grid-template-columns: 1fr;
              max-width: 480px;
            }

            .testimonial-card,
            .testimonial-card:nth-child(2),
            .testimonial-card:nth-child(3) {
              transform: rotate(-1deg);
            }

            .testimonial-card:hover {
              transform: rotate(0deg) translateY(-5px);
            }

            .trust-green-shape-three {
              display: none;
            }
          }

          @media (max-width: 640px) {
            .trust-section {
              padding: 56px 0 72px;
            }

            .trust-title {
              font-size: clamp(34px, 11vw, 48px);
            }

            .trust-subtitle {
              font-size: 14px;
              line-height: 1.6;
            }

            .testimonial-card {
              min-height: auto;
              padding: 22px 20px;
              border-radius: 22px;
            }

            .testimonial-profile {
              grid-template-columns: 54px minmax(0, 1fr);
              gap: 12px;
            }

            .testimonial-photo-wrap {
              width: 54px;
              height: 54px;
            }

            .testimonial-title {
              font-size: 17px;
            }

            .testimonial-text {
              font-size: 12.5px;
            }

            .trust-green-shape-one {
              width: 260px;
              height: 130px;
              left: -140px;
            }

            .trust-green-shape-two {
              width: 260px;
              height: 140px;
              right: -150px;
            }
          }

          @media (max-width: 380px) {
            .trust-container {
              padding-inline: 14px;
            }

            .testimonial-card {
              padding: 20px 18px;
            }

            .testimonial-profile {
              grid-template-columns: 50px minmax(0, 1fr);
            }

            .testimonial-photo-wrap {
              width: 50px;
              height: 50px;
            }

            .testimonial-name {
              font-size: 13.8px;
            }

            .testimonial-star {
              width: 13px;
              height: 13px;
            }

            .testimonial-dots span {
              width: 6px;
              height: 6px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .testimonial-card {
              transition: none;
            }

            .testimonial-card:hover {
              transform: none;
            }
          }
        `}
      </style>

      <div className="trust-green-shape-one" />
      <div className="trust-green-shape-two" />
      <div className="trust-green-shape-three" />

      <div className="trust-container">
        <div ref={titleRef} className="trust-title-wrap">
          <h2 className="trust-title">Dipercaya Ribuan Pengguna</h2>
          <p className="trust-subtitle">Cerita dari ekosistem SeribuAsa.</p>
        </div>

        <div ref={gridRef} className="testimonial-grid">
          {testimonials.map((t) => (
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-profile">
                <div className="testimonial-photo-wrap">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="testimonial-photo"
                    loading="lazy"
                  />
                </div>

                <div className="testimonial-identity">
                  <div className="testimonial-name-row">
                    <h3 className="testimonial-name">{t.name}</h3>

                    <div className="testimonial-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className="testimonial-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="testimonial-star" />
                    ))}
                  </div>
                </div>
              </div>

              <h4 className="testimonial-title">{t.title}</h4>

              <p className="testimonial-text">{t.text}</p>

              <div className="testimonial-footer">
                <div className="testimonial-role">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}