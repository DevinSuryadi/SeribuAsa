const allowedCategories = [
  {
    name: "Makanan Pokok",
    emoji: "🌾",
    desc: "Beras, jagung, ubi",
    color: "bg-amber-50 border-amber-200",
  },
  {
    name: "Protein",
    emoji: "🥩",
    desc: "Daging, ikan, telur",
    color: "bg-red-50 border-red-200",
  },
  {
    name: "Susu & Olahan",
    emoji: "🥛",
    desc: "Susu, keju, yogurt",
    color: "bg-blue-50 border-blue-200",
  },
  {
    name: "Sayuran",
    emoji: "🥬",
    desc: "Semua jenis sayuran",
    color: "bg-green-50 border-green-200",
  },
  {
    name: "Buah-buahan",
    emoji: "🍎",
    desc: "Semua jenis buah",
    color: "bg-rose-50 border-rose-200",
  },
  {
    name: "Kacang-kacangan",
    emoji: "🫘",
    desc: "Kedelai, kacang hijau",
    color: "bg-orange-50 border-orange-200",
  },
];

const faqItems = [
  {
    q: "Bagaimana cara menggunakan saldo dompet?",
    a: "Pilih produk di Katalog Pangan, masukkan ke keranjang, lalu checkout. Saldo akan otomatis terpakai saat pesanan dikonfirmasi.",
  },
  {
    q: "Apa itu sistem FIFO?",
    a: "First In First Out — saldo dari donasi yang lebih lama akan dikonsumsi lebih dahulu sebelum saldo yang baru masuk.",
  },
  {
    q: "Mengapa ada saldo 'ditahan'?",
    a: "Saat Anda memiliki pesanan aktif yang belum diambil, saldo senilai pesanan tersebut ditahan sementara. Saldo akan dikembalikan jika pesanan dibatalkan.",
  },
  {
    q: "Apa yang terjadi jika saldo kadaluarsa?",
    a: "Saldo yang kadaluarsa akan dikembalikan ke pool donasi untuk dialokasikan ke penerima lain yang membutuhkan.",
  },
];

export function InfoDompetTab() {
  return (
    <div className="space-y-8">
      {/* Kategori yang Diperbolehkan */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-foreground">Kategori yang Diperbolehkan</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Saldo Dompet Nutrisi hanya dapat digunakan untuk membeli produk dalam kategori berikut.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allowedCategories.map((cat) => (
            <div
              key={cat.name}
              className={`rounded-2xl border p-4 flex items-center gap-3 transition-all hover:scale-[1.02] hover:shadow-sm ${cat.color}`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{cat.name}</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Prohibited notice */}
        <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Produk yang Tidak Diperbolehkan</p>
            <p className="text-[12px] text-amber-700 leading-relaxed">
              Makanan olahan (mie instan, snack kemasan), junk food, minuman bersoda, minuman
              beralkohol, rokok, dan produk non-pangan tidak dapat dibeli menggunakan saldo dompet.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      {/* <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-foreground">Pertanyaan Umum</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Panduan singkat penggunaan Dompet Nutrisi.
          </p>
        </div>
        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-4 hover:bg-secondary/20 transition-colors"
            >
              <p className="text-sm font-semibold text-foreground mb-1.5">💬 {item.q}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div> */}

      {/* How it works */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-6">
        <h2 className="text-base font-bold text-foreground mb-4">Cara Kerja E-Wallet Nutrisi</h2>
        <div className="space-y-4">
          {[
            { step: "1", title: "Donatur Berdonasi", desc: "Donatur menyalurkan dana ke platform SeribuAsa." },
            { step: "2", title: "Admin Mengalokasikan", desc: "Admin memverifikasi penerima manfaat dan mengalokasikan saldo ke dompet Anda." },
            { step: "3", title: "Anda Berbelanja", desc: "Gunakan saldo untuk membeli bahan pangan bergizi di Katalog Pangan." },
            { step: "4", title: "Vendor Menyiapkan", desc: "Vendor menyiapkan paket dan Anda mengambil dengan scan QR Code." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-black">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
