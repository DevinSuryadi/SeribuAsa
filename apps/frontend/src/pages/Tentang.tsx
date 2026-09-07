import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { SEO } from "../components/SEO";
import { useScrollReveal } from "../hooks/useScrollReveal";
import {
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ShieldCheck,
  HeartHandshake,
  BarChart3,
} from "lucide-react";

import faruq from "../assets/faruq.svg";
import keyna from "../assets/keyna.svg";
import devin from "../assets/devin.svg";
import ilham from "../assets/ilham.svg";
import dosbing from "../assets/dosbing.svg";

const faqs = [
  {
    q: "Apa itu e-voucher SeribuAsa?",
    a: "E-voucher SeribuAsa adalah saldo digital terbatas yang hanya bisa digunakan untuk membeli bahan pangan bergizi seperti telur, susu, sayuran, buah, dan daging dari mitra vendor terverifikasi.",
  },
  {
    q: "Bagaimana proses verifikasi penerima manfaat?",
    a: "Calon penerima mendaftar dengan NIK dan data keluarga. Tim kami memverifikasi kelayakan berdasarkan data DTKS, profil rumah tangga, dan skor FIES (Food Insecurity Experience Scale).",
  },
  {
    q: "Apa itu FIES dan mengapa penting?",
    a: "FIES (Food Insecurity Experience Scale) adalah survei 8 pertanyaan standar internasional untuk mengukur tingkat kerawanan pangan. Hasilnya menentukan prioritas bantuan.",
  },
  {
    q: "Bagaimana data pribadi saya dilindungi?",
    a: "Kami menerapkan enkripsi data, row-level security, dan masking data sensitif. NIK dan informasi pribadi tidak pernah dibagikan kepada pihak ketiga.",
  },
  {
    q: "Bisakah saya melihat ke mana donasi saya disalurkan?",
    a: "Ya! Setiap donatur mendapat dashboard dampak yang menunjukkan alokasi dana, jumlah penerima, dan indikator nutrisi secara transparan.",
  },
  {
    q: "Makanan apa saja yang bisa dibeli dengan voucher?",
    a: "Hanya bahan pangan mentah bergizi: telur, susu, sayuran, buah-buahan, daging, ikan, kacang-kacangan, dan biji-bijian. Makanan olahan dan junk food tidak diperbolehkan.",
  },
];

const values = [
  {
    title: "Misi",
    desc: "Menghapus kerawanan pangan melalui distribusi bantuan nutrisi yang tepat sasaran, terukur, dan transparan.",
    icon: HeartHandshake,
  },
  {
    title: "Visi",
    desc: "Indonesia di mana setiap anak, ibu hamil, dan keluarga rentan terjamin akses pangannya.",
    icon: ShieldCheck,
  },
  {
    title: "Nilai",
    desc: "Transparansi, keadilan distribusi, berbasis data, dan keberlanjutan dampak.",
    icon: BarChart3,
  },
];

const team = [
  {
    name: "Achmad Faruq Mahdison",
    role: "Project Manager",
    photo: faruq,
    photoClass: "team-photo-faruq",
  },
  {
    name: "Keyna Fatima Abinalibrata",
    role: "Frontend Engineer",
    photo: keyna,
    photoClass: "team-photo-keyna",
  },
  {
    name: "Devin Suryadi",
    role: "Backend Engineer",
    photo: devin,
    photoClass: "team-photo-devin",
  },
  {
    name: "Muhammad Ilhamsyah Ridwan",
    role: "Backend Engineer",
    photo: ilham,
    photoClass: "team-photo-ilham",
  },
  {
    name: "Dosen Pembimbing",
    role: "Dosen Pembimbing",
    photo: dosbing,
    photoClass: "team-photo-dosbing",
  },
];

const Tentang = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", msg: "" });

  const filled = form.name && form.email && form.msg;

  const heroRef = useScrollReveal({ y: 30 });
  const missionRef = useScrollReveal({ y: 30 });
  const teamRef = useScrollReveal({ y: 30 });
  const faqRef = useScrollReveal({ y: 30 });
  const contactRef = useScrollReveal({ y: 30 });

  return (
    <div className="min-h-screen bg-[#fbf6ec] relative overflow-hidden">
      <SEO
        title="Tentang Kami"
        description="Pelajari tentang SeribuAsa, platform e-voucher nutrisi yang menghubungkan donatur dengan keluarga rentan. Visi, misi, dan nilai-nilai kami dalam mengatasi kerawanan pangan Indonesia."
        canonical="https://seribuasa.id/tentang"
        keywords="tentang seribuasa, visi misi seribuasa, platform donasi indonesia, e-voucher nutrisi"
      />

      <style>
        {`
          .about-page,
          .about-page * {
            box-sizing: border-box;
          }

          .about-page {
            position: relative;
            background:
              linear-gradient(180deg, #fbf6ec 0%, #f7f1e5 100%);
          }

          .section-title {
            font-family: Georgia, "Times New Roman", serif;
            color: #154632;
            line-height: 1.02;
            letter-spacing: -0.045em;
          }

          .soft-card {
            background: rgba(255, 255, 255, 0.78);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(47, 111, 70, 0.10);
            box-shadow:
              0 16px 38px rgba(29, 68, 44, 0.07),
              inset 0 1px 0 rgba(255, 255, 255, 0.78);
          }

          .about-hero {
            position: relative;
            max-width: 1180px;
            margin: 0 auto;
            padding: clamp(42px, 7vw, 86px) clamp(18px, 4vw, 34px) clamp(28px, 5vw, 54px);
            z-index: 1;
            min-height: clamp(420px, 54vw, 600px);
            display: flex;
            align-items: center;
            overflow: visible;
          }

          .about-hero-copy {
            position: relative;
            z-index: 3;
            max-width: 780px;
          }

          .about-hero-title {
            margin: 0;
            max-width: 780px;
            font-size: clamp(42px, 6vw, 72px);
            font-weight: 850;
            text-align: left;
          }

          .about-hero-desc {
            max-width: 590px;
            margin: 24px 0 0;
            color: #617166;
            font-size: clamp(14px, 1.5vw, 16px);
            line-height: 1.9;
            text-align: left;
          }

          .about-hero-line {
            width: min(420px, 88%);
            height: 1px;
            margin-top: 30px;
            background: linear-gradient(
              90deg,
              rgba(47, 111, 70, 0.28),
              rgba(47, 111, 70, 0.08),
              transparent
            );
          }

          .hero-liquid-left,
          .hero-liquid-right,
          .hero-liquid-small,
          .hero-liquid-dot {
            position: absolute;
            pointer-events: none;
            z-index: 1;
            background: #2f6f46;
          }

          .hero-liquid-left {
            left: -420px;
            top: 70px;
            width: 430px;
            height: 490px;
            opacity: 0.075;
            border-radius: 52% 48% 64% 36% / 44% 58% 42% 56%;
            transform: rotate(-18deg);
          }

          .hero-liquid-right {
            right: -360px;
            top: 28px;
            width: 520px;
            height: 560px;
            opacity: 0.085;
            border-radius: 48% 52% 36% 64% / 52% 42% 58% 48%;
            transform: rotate(16deg);
          }

          .hero-liquid-small {
            right: 8%;
            bottom: 46px;
            width: 150px;
            height: 132px;
            opacity: 0.055;
            border-radius: 60% 40% 56% 44% / 48% 62% 38% 52%;
            transform: rotate(-10deg);
          }

          .hero-liquid-dot {
            left: 58%;
            top: 28%;
            width: 86px;
            height: 86px;
            opacity: 0.04;
            border-radius: 55% 45% 60% 40% / 50% 56% 44% 50%;
            transform: rotate(22deg);
          }

          .value-card {
            border-radius: 24px;
            padding: 24px;
            height: 100%;
          }

          .team-full {
            position: relative;
            left: 50%;
            width: 100vw;
            margin-left: -50vw;
            background:
              radial-gradient(circle at 50% 0%, rgba(119, 192, 139, 0.22), transparent 34%),
              radial-gradient(circle at 12% 90%, rgba(251, 246, 236, 0.08), transparent 22%),
              radial-gradient(circle at 88% 15%, rgba(251, 246, 236, 0.05), transparent 20%),
              linear-gradient(180deg, #092816 0%, #0b311e 54%, #103a25 100%);
            padding: clamp(58px, 7vw, 82px) 0;
            overflow: hidden;
          }

          .team-container {
            max-width: 1180px;
            margin: 0 auto;
            padding: 0 clamp(18px, 5vw, 34px);
            position: relative;
            z-index: 2;
          }

          .team-header {
            text-align: center;
            max-width: 680px;
            margin: 0 auto;
          }

          .team-kicker {
            margin: 0;
            color: #b8d8c1;
            font-size: 12px;
            font-weight: 850;
            letter-spacing: 0.17em;
            text-transform: uppercase;
          }

          .team-title {
            margin: 10px 0 0;
            font-family: Georgia, "Times New Roman", serif;
            color: #fbf6ec;
            font-size: clamp(32px, 5vw, 54px);
            line-height: 0.98;
            font-weight: 850;
            letter-spacing: -0.045em;
          }

          .team-subtitle {
            margin: 16px auto 0;
            max-width: 540px;
            color: rgba(251, 246, 236, 0.72);
            font-size: 14px;
            line-height: 1.75;
          }

          .team-grid {
            margin-top: clamp(34px, 5vw, 52px);
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: clamp(14px, 2vw, 20px);
            align-items: stretch;
          }

          .team-card {
            position: relative;
            overflow: hidden;
            border-radius: 24px;
            padding: 12px;
            background:
              linear-gradient(180deg, rgba(251, 246, 236, 0.09), rgba(251, 246, 236, 0.035)),
              rgba(255, 255, 255, 0.045);
            border: 1px solid rgba(251, 246, 236, 0.12);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.08),
              0 18px 34px rgba(0, 0, 0, 0.18);
            transition:
              transform 0.22s ease,
              box-shadow 0.22s ease,
              border-color 0.22s ease;
          }

          .team-card:hover {
            transform: translateY(-5px);
            border-color: rgba(251, 246, 236, 0.24);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.10),
              0 26px 44px rgba(0, 0, 0, 0.26);
          }

          .team-photo-area {
            position: relative;
            height: 238px;
            border-radius: 18px;
            overflow: hidden;
            background:
              radial-gradient(circle at 50% 0%, rgba(142, 209, 162, 0.42), transparent 48%),
              linear-gradient(180deg, #327d4f 0%, #0d3923 82%);
          }

          .team-photo-area::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(circle at 50% 72%, rgba(251, 246, 236, 0.12), transparent 34%),
              linear-gradient(180deg, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.72) 100%);
            z-index: 1;
            pointer-events: none;
          }

          .team-photo {
            position: absolute;
            left: 50%;
            bottom: 0;
            width: 116%;
            height: 100%;
            object-fit: contain;
            object-position: center bottom;
            transform: translateX(-50%) scale(1.06);
            transform-origin: bottom center;
            display: block;
            z-index: 0;
          }

          .team-photo-faruq {
            transform: translateX(-50%) scale(1.08);
          }

          .team-photo-keyna {
            transform: translateX(-50%) scale(1.2);
          }

          .team-photo-devin {
            transform: translateX(-50%) scale(1.2);
          }

          .team-photo-ilham {
            transform: translateX(-50%) scale(1.28);
          }

          .team-photo-dosbing {
            transform: translateX(-50%) scale(1.1);
          }

          .team-name-layer {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 3;
            padding: 60px 14px 14px;
            background: linear-gradient(
              180deg,
              rgba(8, 31, 19, 0) 0%,
              rgba(8, 31, 19, 0.44) 48%,
              rgba(8, 31, 19, 0.92) 100%
            );
          }

          .team-name {
            margin: 0;
            color: #ffffff;
            font-size: clamp(15px, 1.45vw, 18px);
            line-height: 1.14;
            font-weight: 850;
            letter-spacing: -0.035em;
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.36);
          }

          .team-role {
            min-height: 44px;
            padding: 13px 3px 2px;
            color: rgba(251, 246, 236, 0.78);
            font-size: 10.5px;
            line-height: 1.45;
            font-weight: 850;
            letter-spacing: 0.13em;
            text-transform: uppercase;
          }

          .faq-item {
            border-radius: 20px;
            overflow: hidden;
          }

          .contact-shell {
            border-radius: 30px;
            overflow: hidden;
          }

          @media (max-width: 1100px) {
            .team-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
              max-width: 760px;
              margin-left: auto;
              margin-right: auto;
            }
          }

          @media (max-width: 760px) {
            .about-hero {
              min-height: auto;
              padding: 36px clamp(18px, 5vw, 24px) 42px;
              overflow: hidden;
            }

            .about-hero-title,
            .about-hero-desc {
              text-align: left;
            }

            .about-hero-line {
              width: 100%;
              max-width: 320px;
            }

            .hero-liquid-left {
              left: -360px;
              top: 90px;
              width: 390px;
              height: 440px;
              opacity: 0.07;
            }

            .hero-liquid-right {
              right: -360px;
              top: 20px;
              width: 440px;
              height: 500px;
              opacity: 0.075;
            }

            .hero-liquid-small {
              right: -20px;
              bottom: 8px;
              width: 110px;
              height: 96px;
              opacity: 0.05;
            }

            .team-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              max-width: 520px;
            }

            .team-photo-area {
              height: 228px;
            }
          }

          @media (max-width: 520px) {
            .about-hero {
              padding-top: 20px;
            }

            .about-hero-title {
              font-size: clamp(34px, 12vw, 48px);
            }

            .hero-liquid-dot {
              display: none;
            }

            .team-full {
              padding: 48px 0 58px;
            }

            .team-grid {
              grid-template-columns: 1fr;
              max-width: 270px;
            }

            .team-card {
              border-radius: 22px;
            }

            .team-photo-area {
              height: 250px;
            }

            .team-name {
              font-size: 18px;
            }

            .contact-shell {
              border-radius: 22px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .team-card {
              transition: none;
            }

            .team-card:hover {
              transform: none;
            }
          }
        `}
      </style>

      <div className="about-page relative z-0">
        <Navbar />

        <main className="pt-24 md:pt-28 pb-16 md:pb-20 relative z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* HERO */}
            <section ref={heroRef} className="mb-16 md:mb-20">
              <div className="about-hero">
                <div className="hero-liquid-left" aria-hidden="true" />
                <div className="hero-liquid-right" aria-hidden="true" />
                <div className="hero-liquid-small" aria-hidden="true" />
                <div className="hero-liquid-dot" aria-hidden="true" />

                <div className="about-hero-copy">
                  <h1 className="about-hero-title section-title">
                    Membangun akses pangan bergizi yang lebih adil dan
                    transparan.
                  </h1>

                  <p className="about-hero-desc">
                    SeribuAsa menghubungkan donatur dengan keluarga rentan
                    melalui distribusi bantuan nutrisi berbasis e-voucher. Setiap
                    bantuan dirancang agar lebih tepat sasaran, mudah dipantau,
                    dan berdampak bagi penerima.
                  </p>

                  <div className="about-hero-line" />
                </div>
              </div>
            </section>

            {/* VALUES */}
            <section ref={missionRef} className="mb-16 md:mb-20">
              <div className="text-center mb-9">
                <h2 className="section-title text-3xl sm:text-4xl font-bold">
                  Fondasi yang kami pegang
                </h2>
                <p className="mt-3 text-[#6a776f] text-sm sm:text-base max-w-xl mx-auto leading-7">
                  SeribuAsa dibangun dengan prinsip yang menjaga setiap keputusan
                  tetap dekat dengan dampak sosial.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {values.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.title} className="soft-card value-card">
                      <div className="w-12 h-12 rounded-2xl bg-[#2f6f46] text-white flex items-center justify-center shadow-lg shadow-green-900/10">
                        <Icon size={20} />
                      </div>

                      <h3 className="mt-5 text-2xl font-bold text-[#154632]">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-[#66746b]">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* TEAM */}
            <section ref={teamRef} className="mb-16 md:mb-20">
              <div className="team-full">
                <div className="team-container">
                  <div className="team-header">
                    <p className="team-kicker">Tim Pengembang</p>
                    <h2 className="team-title">Orang-orang di balik SeribuAsa</h2>
                    <p className="team-subtitle">
                      Tim yang membangun pengalaman SeribuAsa agar tetap hangat,
                      kredibel, dan mudah digunakan.
                    </p>
                  </div>

                  <div className="team-grid">
                    {team.map((member) => (
                      <article key={member.name} className="team-card">
                        <div className="team-photo-area">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className={`team-photo ${member.photoClass}`}
                            loading="lazy"
                          />

                          <div className="team-name-layer">
                            <h3 className="team-name">{member.name}</h3>
                          </div>
                        </div>

                        <div className="team-role">{member.role}</div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section ref={faqRef} className="max-w-3xl mx-auto mb-16 md:mb-20">
              <div className="text-center mb-8">
                <h2 className="section-title text-3xl sm:text-4xl font-bold">
                  Pertanyaan Umum
                </h2>
                <p className="mt-3 text-[#6a776f] text-sm sm:text-base leading-7">
                  Jawaban singkat untuk hal-hal yang paling sering ditanyakan.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {faqs.map((faq, i) => {
                  const key = `item-${i}`;
                  const isOpen = openFaq === key;

                  return (
                    <div key={key} className="soft-card faq-item">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : key)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-transparent border-none cursor-pointer text-left"
                      >
                        <span className="text-sm sm:text-[15px] font-semibold text-[#173b2a] leading-relaxed">
                          {faq.q}
                        </span>

                        <ChevronDown
                          size={18}
                          className="text-[#2f6f46] shrink-0 transition-transform duration-200"
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </button>

                      <div
                        className="overflow-hidden transition-all duration-300"
                        style={{ maxHeight: isOpen ? 320 : 0 }}
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-[#2f6f46]/10 text-sm leading-7 text-[#66746b]">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* CONTACT */}
            <section ref={contactRef} className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="section-title text-3xl sm:text-4xl font-bold">
                  Hubungi Kami
                </h2>

                <p className="mt-3 text-[#6a776f] text-sm sm:text-base max-w-xl mx-auto leading-7">
                  Kami terbuka untuk kolaborasi, pertanyaan, maupun masukan
                  terkait pengembangan SeribuAsa.
                </p>
              </div>

              <div className="contact-shell soft-card grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
                <div className="bg-[#f4eee2] p-6 sm:p-8 border-b md:border-b-0 md:border-r border-[#2f6f46]/10">
                  <h3 className="text-2xl font-bold text-[#154632]">
                    Informasi Kontak
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#6a776f]">
                    Tim kami siap membantu menjawab kebutuhan informasi dan
                    menjalin kerja sama yang berdampak.
                  </p>

                  <div className="mt-7 flex flex-col gap-5">
                    {[
                      { icon: Mail, label: "Email", value: "info@seribuasa.id" },
                      { icon: Phone, label: "Telepon", value: "(021) 1234-5678" },
                      {
                        icon: MapPin,
                        label: "Alamat",
                        value: "Jl. Sudirman No. 123, Jakarta Pusat 10110",
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#2f6f46] text-white flex items-center justify-center shrink-0 shadow-md shadow-green-900/10">
                          <item.icon className="w-[18px] h-[18px]" />
                        </div>

                        <div>
                          <div className="text-xs font-semibold tracking-wide uppercase text-[#7d8b83] mb-1">
                            {item.label}
                          </div>

                          <div className="text-sm text-[#284535] leading-6">
                            {item.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 sm:p-8 bg-white/55">
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        id: "name",
                        label: "Nama",
                        type: "text",
                        placeholder: "Nama lengkap",
                      },
                      {
                        id: "email",
                        label: "Email",
                        type: "email",
                        placeholder: "email@contoh.com",
                      },
                    ].map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-[#56675e] mb-2">
                          {field.label}
                        </label>

                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={form[field.id as "name" | "email"]}
                          onChange={(e) =>
                            setForm({ ...form, [field.id]: e.target.value })
                          }
                          className="w-full h-11 px-4 rounded-xl border border-[#d8e3d9] text-sm text-[#173b2a] outline-none bg-white transition focus:border-[#2f6f46] focus:ring-2 focus:ring-[#2f6f46]/10"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-[#56675e] mb-2">
                        Pesan
                      </label>

                      <textarea
                        placeholder="Tulis pesan Anda..."
                        rows={5}
                        value={form.msg}
                        onChange={(e) =>
                          setForm({ ...form, msg: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-[#d8e3d9] text-sm text-[#173b2a] outline-none bg-white transition focus:border-[#2f6f46] focus:ring-2 focus:ring-[#2f6f46]/10 resize-y font-inherit"
                      />
                    </div>

                    <button
                      disabled={!filled}
                      className={`mt-2 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                        filled
                          ? "bg-[#2f6f46] text-white hover:bg-[#265d3b] shadow-lg shadow-green-900/10 hover:-translate-y-0.5"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Kirim Pesan
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Tentang;