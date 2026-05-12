import { useState } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { Mail, Phone, MapPin, ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'Apa itu e-voucher SeribuAsa?', a: 'E-voucher SeribuAsa adalah saldo digital terbatas yang hanya bisa digunakan untuk membeli bahan pangan bergizi seperti telur, susu, sayuran, buah, dan daging dari mitra vendor terverifikasi.' },
  { q: 'Bagaimana proses verifikasi penerima manfaat?', a: 'Calon penerima mendaftar dengan NIK dan data keluarga. Tim kami memverifikasi kelayakan berdasarkan data DTKS, profil rumah tangga, dan skor FIES (Food Insecurity Experience Scale).' },
  { q: 'Apa itu FIES dan mengapa penting?', a: 'FIES (Food Insecurity Experience Scale) adalah survei 8 pertanyaan standar internasional untuk mengukur tingkat kerawanan pangan. Hasilnya menentukan prioritas bantuan.' },
  { q: 'Bagaimana data pribadi saya dilindungi?', a: 'Kami menerapkan enkripsi data, row-level security, dan masking data sensitif. NIK dan informasi pribadi tidak pernah dibagikan kepada pihak ketiga.' },
  { q: 'Bisakah saya melihat ke mana donasi saya disalurkan?', a: 'Ya! Setiap donatur mendapat dashboard dampak yang menunjukkan alokasi dana, jumlah penerima, dan indikator nutrisi secara transparan.' },
  { q: 'Makanan apa saja yang bisa dibeli dengan voucher?', a: 'Hanya bahan pangan mentah bergizi: telur, susu, sayuran, buah-buahan, daging, ikan, kacang-kacangan, dan biji-bijian. Makanan olahan dan junk food tidak diperbolehkan.' },
];

const values = [
  { title: 'Misi', desc: 'Menghapus kerawanan pangan melalui distribusi bantuan nutrisi yang tepat sasaran, terukur, dan transparan.' },
  { title: 'Visi', desc: 'Indonesia di mana setiap anak, ibu hamil, dan keluarga rentan terjamin akses pangannya.' },
  { title: 'Nilai', desc: 'Transparansi, keadilan distribusi, berbasis data, dan keberlanjutan dampak.' },
];

const Tentang = () => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', msg: '' });
  const filled = form.name && form.email && form.msg;

  const heroRef = useScrollReveal({ y: 30 });
  const missionRef = useScrollReveal({ y: 30 });
  const faqRef = useScrollReveal({ y: 30 });
  const contactRef = useScrollReveal({ y: 30 });

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)' }}
      />
      <div className="absolute -top-16 -left-24 w-96 h-96 rounded-full pointer-events-none z-0"
        style={{ background: 'rgba(34,197,94,0.06)', filter: 'blur(90px)' }}
      />

      <Navbar />

      <main className="pt-24 md:pt-28 pb-16 md:pb-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Hero */}
          <div ref={heroRef} className="text-center mb-14 md:mb-20">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Tentang <span className="text-green-600">SeribuAsa</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
              Platform digital yang memastikan setiap keluarga Indonesia mendapat akses pangan bergizi yang layak dan terukur.
            </p>
          </div>

          {/* Values — 1 col mobile, 3 on md+ */}
          <div ref={missionRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-16 md:mb-20">
            {values.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="text-2xl font-bold text-green-700 mb-2">{item.title}</div>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div ref={faqRef} className="max-w-2xl mx-auto mb-16 md:mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center tracking-tight mb-8">
              Pertanyaan Umum
            </h2>
            <div className="flex flex-col gap-2">
              {faqs.map((faq, i) => {
                const key = `item-${i}`;
                const isOpen = openFaq === key;
                return (
                  <div key={key} className="rounded-xl border border-gray-100 bg-white/85 backdrop-blur-md overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : key)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-transparent border-none cursor-pointer text-left"
                    >
                      <span className="text-sm font-semibold text-gray-900 leading-snug">{faq.q}</span>
                      <ChevronDown
                        size={16}
                        className="text-green-600 shrink-0 transition-transform duration-200"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{ maxHeight: isOpen ? 300 : 0 }}
                    >
                      <div className="px-5 pb-4 pt-3 border-t border-gray-100 text-sm text-gray-500 leading-relaxed">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact — stacks on mobile, side-by-side on md+ */}
          <div ref={contactRef} className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center tracking-tight mb-8">
              Hubungi Kami
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-8">
              {/* Info */}
              <div className="flex flex-col gap-5">
                {[
                  { icon: Mail, label: 'Email', value: 'info@seribuasa.id' },
                  { icon: Phone, label: 'Telepon', value: '(021) 1234-5678' },
                  { icon: MapPin, label: 'Alamat', value: 'Jl. Sudirman No. 123, Jakarta Pusat 10110' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-400 mb-0.5">{item.label}</div>
                      <div className="text-sm text-gray-700">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form */}
              <div className="rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md p-5 flex flex-col gap-4">
                {[
                  { id: 'name', label: 'Nama', type: 'text', placeholder: 'Nama lengkap' },
                  { id: 'email', label: 'Email', type: 'email', placeholder: 'email@contoh.com' },
                ].map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.id as 'name' | 'email']}
                      onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none bg-white transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Pesan</label>
                  <textarea
                    placeholder="Tulis pesan Anda..."
                    rows={4}
                    value={form.msg}
                    onChange={(e) => setForm({ ...form, msg: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none bg-white transition focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-y font-inherit"
                  />
                </div>
                <button
                  disabled={!filled}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${filled ? 'bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200 hover:-translate-y-0.5' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                >
                  Kirim Pesan
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tentang;