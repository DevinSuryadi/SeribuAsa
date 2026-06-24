# Materi Presentasi UAS - Aplikasi SeribuAsa
*(Alokasi: 20 Menit Presentasi, 15 Menit QnA)*

---

## Slide 1: Judul
**SeribuAsa: Platform Digital Pencegahan Stunting Melalui Ekosistem Donasi Pangan Bernutrisi**
- [Nama Anggota Kelompok / Tim]
- Mata Kuliah / Program Studi
- Logo Universitas / Institusi

---

## Slide 2: Latar Belakang (Brief - Maks. 1 menit)
- **Problem:** Tingginya angka stunting dan kurangnya transparansi serta distribusi donasi pangan yang tepat sasaran.
- **Solusi (SeribuAsa):** Ekosistem terintegrasi yang menghubungkan 3 pilar: Donatur, Penerima Manfaat (keluarga balita), dan Mitra Vendor (warung pangan lokal).
- **Core Tech:** AI Stunting Prediction, Midtrans Payment Gateway, E-Wallet (Voucher Nutrisi), dan Supabase.

---

## Slide 3-4: Ketercapaian Fitur Akhir
*(Visual: Tampilkan arsitektur sederhana atau screenshot dashboard per role)*

**1. Modul Donatur (Donor)**
- **✅ Selesai:** Integrasi Payment Gateway (Midtrans) untuk donasi tunggal & langganan.
- **✅ Selesai:** Dashboard Impact Report (grafik donasi, wilayah terjangkau, jumlah anak terbantu).

**2. Modul Penerima Manfaat (Beneficiary)**
- **✅ Selesai:** Sistem E-Wallet (Dompet Nutrisi) berdasar alokasi donasi.
- **✅ Selesai:** Fitur Pemantauan Gizi Anak & Algoritma Prediksi Risiko Stunting (AI Model Logistic Regression).
- **✅ Selesai:** Integrasi form survei FIES (Ketahanan Pangan).
- **✅ Selesai:** Checkout belanja pangan via QR Code.

**3. Modul Mitra Vendor (Warung)**
- **✅ Selesai:** Manajemen stok Katalog Produk pangan bergizi.
- **✅ Selesai:** Fitur QR Scanner untuk validasi pencairan pesanan.
- **✅ Selesai:** Sistem Settlement (pencairan dana ke vendor).

**4. Modul Admin (Pengelola Sistem)**
- **✅ Selesai:** Dashboard Monitoring (Pengguna, Produk, Donasi, Voucher E-Wallet).
- **✅ Selesai:** Sistem approval kelayakan akun dan laporan CSV Analytics.

---

## Slide 5: Hasil Testing Internal (White Box & Black Box)
*(Fokus: Menguji stabilitas otak aplikasi dan ketahanan interaksi user)*

**1. White Box Testing (Struktural & Logika Internal)**
*Diuji menggunakan automated testing framework: Pytest (Backend) & Vitest (Frontend)*
- **Pengujian Algoritma AI Stunting:** Divalidasi bahwa model Logistic Regression mampu mengklasifikasikan risiko (Rendah/Sedang/Tinggi) secara akurat berdasarkan input spesifik (usia, tinggi, berat badan).
- **Pengujian Kalkulator Z-Score WHO:** Memvalidasi bahwa perhitungan pertumbuhan anak selaras 100% dengan standar tabel kurva pertumbuhan internasional WHO.
- **Pengujian Integrasi & Keamanan:** Verifikasi sistem keamanan otorisasi JWT dari Supabase Auth pada 26 *endpoints* API.
- **Hasil:** *Test Coverage* tercapai, logika backend berjalan mulus tanpa celah keamanan (*Zero logic failure* pada *Continuous Integration*).

**2. Black Box / End-to-End (E2E) Testing**
*Diuji menggunakan Playwright untuk simulasi interaksi antarmuka riil.*
- **Alur Kritis yang Lolos Uji:**
  - **Payment Gateway:** Webhook Midtrans dari status *Pending* hingga berubah sukses secara otomatis.
  - **Sistem E-Wallet & Keranjang:** Pencegahan *checkout* jika stok vendor habis atau saldo Dompet Nutrisi tidak mencukupi (memunculkan *error toast* / notifikasi yang informatif).
- **Hasil:** Aplikasi siap pakai (*Production-ready*), tahan terhadap skenario *edge-cases* maupun *human error* saat input.

---

## Slide 6: Hasil Testing Eksternal (User Acceptance Testing)
*(Metodologi: Unmoderated Testing kepada 48 Responden. Terdiri dari Donatur 75%, Penerima Manfaat 12.5%, Vendor 8.3%, Admin 4.2%)*

**1. System Usability Scale (SUS) — Evaluasi Kemudahan Pakai**
- **Skor Akhir: 77.19 (Kategori: Good / Grade B)**
- **Analisis:** Berada di atas standar global (68). Angka ini membuktikan bahwa *Learning Curve* (waktu adaptasi) aplikasi SeribuAsa sangat singkat. Pengguna awam sekalipun mampu memahami alur pemilihan paket donasi, hingga proses pembayaran *checkout* via QR Code tanpa perlu melihat manual book.

**2. End User Computing Satisfaction (EUCS) — Evaluasi Kepuasan Pengguna**
- **Skor Rata-Rata: 3.66 / 5.00 (Tingkat Kepuasan 73.16%)**
- **Breakdown 5 Dimensi Kepuasan:**
  - **Content (Konten) & Accuracy (Akurasi):** Paling tinggi. Pengguna mengapresiasi transparansi *Impact Dashboard* dan keakuratan hasil prediksi AI Stunting.
  - **Format (Tampilan):** Representasi visual grafik, statistik laporan, dan UI modern mendapat sentimen sangat positif.
  - **Ease of Use & Timeliness (Kemudahan & Kecepatan):** Kecepatan *load* data (*real-time update* saldo e-wallet pasca-donasi) dinilai sangat responsif.

---

## Slide 7: Rekomendasi Perbaikan
Berdasarkan hasil analisis, pengujian, dan masukan responden (yang relevan dengan fitur yang akan didemokan), berikut fokus perbaikan ke depan:
1. **Ekspansi Metode Pembayaran Langsung (Donatur):** Mengintegrasikan fitur *Auto-Debet* (langganan otomatis) agar donatur tidak perlu mengulang proses Midtrans secara manual tiap bulannya.
2. **Edukasi Visual In-App (Penerima Manfaat):** Menambahkan *tutorial overlay* atau *tooltip* pintar untuk memandu orang tua dalam membaca kurva pertumbuhan dan hasil deteksi AI Stunting untuk pertama kalinya.
3. **Enhancement UX Kamera Scanner (Vendor):** Mengoptimalkan *resource* kamera pada *in-app browser* agar pemindaian QR Code di warung berjalan lebih mulus pada perangkat *low-end* di daerah terpencil.
4. **Optimasi Berkelanjutan Model AI (Sistem):** Melakukan *fine-tuning* pada model Logistic Regression menggunakan data riil pengguna secara berkala guna mempertajam rekomendasi pangan bernutrisi.

---

## Slide 8: Penutup & Persiapan Demo
**Terima Kasih.**
*Selanjutnya: Demonstrasi Ekosistem SeribuAsa Terintegrasi (Live Demo)*

---

## 📝 SKENARIO DEMO PRODUK (THE "SEBAB-AKIBAT" FLOW)
*(Alokasi Waktu: 5-7 Menit Maksimal. Fokus pada integrasi ujung-ke-ujung / end-to-end).*

**Persiapan Wajib Sebelum Presentasi:**
Siapkan **4 Browser / Window** berbeda yang SUDAH LOGIN menggunakan 4 akun role (Donatur, Penerima, Vendor, Admin). Jangan presentasikan proses *Register/Login* karena membuang waktu.

### ⏱️ Menit 1: "The Trigger" (Tab Role Donatur)
- *Tampilkan Dashboard Donatur:* "Bapak/Ibu, mari kita mulai dari hulu. Saya bertindak sebagai Donatur." Tunjukkan sekilas grafik *Impact Report* yang transparan.
- *Masuk ke menu Donasi:* Pilih "Paket 1000 HPK" (Rp 500.000).
- *Proses Pembayaran:* Klik bayar -> Muncul Pop-up Midtrans -> Lakukan copy-paste VA ke simulator Midtrans Sandbox secara cepat hingga statusnya berubah *Sukses*.
- *Transisi:* "Pembayaran sukses secara *real-time*. Ke mana uang ini pergi? Dana ini tidak kami tahan, tapi langsung masuk ke Dompet Nutrisi milik Penerima Manfaat."

### ⏱️ Menit 2-3: "The Core Tech" (Tab Role Penerima Manfaat)
- *Buka menu Dompet Nutrisi:* Tunjukkan saldo yang bertambah berkat donasi barusan.
- *Buka menu Pemantauan Gizi:* "Ini adalah fitur teknologi utama kami." Input data anak dummy (misal BB/TB yang kurang ideal).
- *Tunjukkan hasil AI:* Perlihatkan kartu Prediksi Risiko Stunting. "AI kami secara instan membaca risiko berdasarkan data medis dan Z-score WHO."
- *Masuk Katalog NutriShop:* Tambahkan Susu dan Telur ke keranjang belanja.
- *Checkout:* "Penerima manfaat tidak perlu membayar dengan uang tunai. Saldo langsung dipotong dari E-wallet. Hasil akhirnya adalah **QR Code Belanja** ini."

### ⏱️ Menit 4: "The Execution" (Tab Role Mitra Vendor / Warung)
- *Buka menu QR Scanner:* (Bisa ditunjukkan via Inspect Element versi mobile atau *webcam*).
- *Skenario:* "Penerima manfaat datang ke warung membawa QR Code tadi. Warung cukup melakukan *scan*."
- *Proses Pemindaian:* Lakukan scan (atau input kode manual). Detail pesanan muncul -> Klik Konfirmasi.
- *Buka menu Settlement (Pencairan Dana):* "Pesanan selesai. Saldo dari E-Wallet penerima kini berpindah ke dasbor pencairan dana warung, siap ditarik ke rekening Vendor."

### ⏱️ Menit 5: "The Oversight" (Tab Role Admin)
- *Buka Dashboard Admin (Laporan & Analitik):*
- *Kesimpulan:* "Seluruh pergerakan uang donasi, distribusi voucher nutrisi, pencegahan stunting, hingga transaksi di warung yang baru saja kita simulasikan... semuanya terekam secara transparan dan *real-time* di Dashboard Pengelola ini."
- *Closing Statement:* "Inilah SeribuAsa. Satu ekosistem digital transparan, merajut ribuan harapan untuk balita Indonesia. Terima kasih."