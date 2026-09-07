import { useState } from "react";
import { Navbar } from "../components/landing/Navbar";
import { Footer } from "../components/landing/Footer";
import { SEO } from "../components/SEO";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";

export default function Kontak() {
  const [form, setForm] = useState({ name: "", email: "", msg: "" });
  const filled = form.name && form.email && form.msg;
  const heroRef = useScrollReveal({ y: 30 });
  const contactRef = useScrollReveal({ y: 30 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pesan terkirim! Kami akan segera menghubungi Anda.");
    setForm({ name: "", email: "", msg: "" });
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <SEO
        title="Hubungi Kami"
        description="Hubungi tim SeribuAsa untuk pertanyaan, kerjasama, atau informasi lebih lanjut tentang platform donasi pangan kami. Email: info@seribuasa.id"
        canonical="https://seribuasa.id/kontak"
        keywords="kontak seribuasa, hubungi seribuasa, kerjasama donasi, csr partnership"
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute -top-16 -left-24 w-96 h-96 rounded-full pointer-events-none z-0"
        style={{ background: "rgba(34,197,94,0.06)", filter: "blur(90px)" }}
      />

      <Navbar />

      <main className="pt-24 md:pt-28 pb-16 md:pb-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={heroRef} className="text-center mb-10 md:mb-14">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Hubungi <span className="text-green-600">Kami</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
              Punya pertanyaan atau ingin berkolaborasi? Kami senang mendengar dari Anda.
            </p>
          </div>

          {/* Contact section — stacks on mobile, side-by-side on md+ */}
          <div ref={contactRef} className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-8">
              {/* Info */}
              <div className="flex flex-col gap-5">
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
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-gray-100 bg-white/85 backdrop-blur-md p-5 flex flex-col gap-4"
              >
                {[
                  { id: "name", label: "Nama", type: "text", placeholder: "Nama lengkap" },
                  { id: "email", label: "Email", type: "email", placeholder: "email@contoh.com" },
                ].map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.id as "name" | "email"]}
                      onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                      required
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
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none bg-white transition focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-y"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!filled}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${filled ? "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200 hover:-translate-y-0.5" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
                >
                  <Send size={15} /> Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
