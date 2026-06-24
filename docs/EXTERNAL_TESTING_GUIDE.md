# Struktur Google Forms — Evaluasi Pengalaman Pengguna Aplikasi SeribuAsa

> Dokumen ini adalah blueprint 1:1 untuk Google Forms external testing (unmoderated).
> Setiap `##` = Section baru di Google Forms.
> Setiap `###` = Pertanyaan di dalam section tersebut.
> Notasi `[Section Logic]` menunjukkan routing/branching antar section.

---

## Section 0: Halaman Pembuka (Deskripsi Formulir)

**Judul Formulir:**
Evaluasi Pengalaman Pengguna Aplikasi SeribuAsa

**Deskripsi:**

Halo! Kami dari tim pengembang SeribuAsa mengundang Anda untuk berpartisipasi dalam uji coba aplikasi SeribuAsa, sebuah platform digital yang berfokus pada pencegahan stunting melalui ekosistem donasi pangan bernutrisi — menghubungkan Donatur, Penerima Manfaat (keluarga balita), dan Mitra Vendor (warung pangan lokal).

Kami mohon Anda untuk memberikan penilaian yang sejujur-jujurnya mengenai pengalaman Anda menggunakan aplikasi ini. Seluruh data Anda akan dijaga kerahasiaannya dan murni digunakan untuk keperluan pengembangan akademis.

Jika Anda mengalami kendala saat mengakses aplikasi atau memiliki pertanyaan terkait pengisian kuesioner, jangan ragu untuk menghubungi kami melalui [masukkan kontak: DM Instagram / WhatsApp / Email tim].

Terima kasih atas partisipasi dan waktu Anda!

---

## Section 1: Persetujuan Responden

### Apakah Anda bersedia menjadi responden evaluasi aplikasi SeribuAsa? *

- Ya, saya bersedia
- Tidak bersedia

> **[Section Logic]:**
> - "Ya, saya bersedia" → lanjut ke **Section 2: Data Responden**
> - "Tidak bersedia" → kirim formulir (selesai)

---

## Section 2: Data Responden

**Deskripsi Section:**
Silakan lengkapi data diri singkat Anda di bawah ini. Informasi ini akan sangat membantu kami dalam mengelompokkan hasil pengujian agar sesuai dengan target pengguna utama aplikasi SeribuAsa.

### Nama Lengkap / Inisial *

_(Jawaban singkat)_

### Kategori Responden / Role yang Akan Diuji *

- Donatur (pihak yang memberikan donasi)
- Penerima Manfaat (orang tua / wali balita penerima bantuan)
- Mitra Vendor (pemilik warung / toko pangan lokal)
- Admin (pengelola sistem)

### Apakah Anda pernah menggunakan aplikasi donasi, pemantauan gizi anak, atau e-commerce pangan sebelumnya? *

- Ya
- Tidak

### Perangkat yang digunakan saat mencoba aplikasi SeribuAsa *

- Smartphone
- Laptop / PC
- Tablet

> **[Section Logic]:**
> Berdasarkan jawaban "Kategori Responden":
> - "Donatur" → lanjut ke **Section 3A: Skenario Donatur**
> - "Penerima Manfaat" → lanjut ke **Section 3B: Skenario Penerima Manfaat**
> - "Mitra Vendor" → lanjut ke **Section 3C: Skenario Mitra Vendor**
> - "Admin" → lanjut ke **Section 3D: Skenario Admin**

---
---

## Section 3A: Skenario Role Donatur

**Deskripsi Section:**

Silakan buka aplikasi SeribuAsa melalui tautan berikut: **https://seribu-asa.vercel.app/**

Lakukan langkah-langkah eksplorasi berikut secara mandiri:

1. Buat akun baru (Register) dengan memilih peran sebagai **Donatur**, atau masuk menggunakan akun yang sudah ada (Login).

2. Lakukan **simulasi Donasi** — pilih salah satu paket donasi yang tersedia (Adopsi Nutrisi 1 Balita / Paket 1000 HPK), pilih metode pembayaran (QRIS, VA BCA, VA Mandiri, GoPay, atau Kartu Kredit), lalu selesaikan pembayaran melalui **simulator Midtrans Sandbox**.

3. Kunjungi halaman **Dashboard Donatur** untuk melihat ringkasan total donasi, jumlah anak terbantu, dan paket aktif.

4. Buka halaman **Riwayat Donasi** untuk melihat daftar transaksi donasi beserta statusnya.

5. Buka halaman **Dampak Donasi** untuk melihat grafik tren donasi bulanan dan distribusi geografis.

6. _(Opsional)_ Buka halaman **Langganan Donasi** untuk melihat atau mencoba fitur donasi berlangganan bulanan.

**Panduan Simulasi Pembayaran Midtrans Sandbox:**
Pembayaran ini murni simulasi dan tidak akan mengambil uang asli dari Anda.
- Link Simulator: https://simulator.sandbox.midtrans.com/
- Lanjutkan proses donasi hingga pop-up pembayaran Midtrans terbuka.
- Pilih metode Virtual Account (misal: BCA VA).
- Buka link simulator pada tab baru, pilih opsi VA yang sesuai.
- Salin nomor VA dari pop-up SeribuAsa, tempel ke kolom simulator.
- Lanjutkan hingga muncul status "Payment Successful".
- Kembali ke SeribuAsa dan cek riwayat donasi Anda.

**Data dummy yang dapat digunakan:**
- Email: testdonatur@gmail.com, Nama: "Donatur Testing"
- Nominal: pilih paket Adopsi Nutrisi 1 Balita (Rp 300.000) atau Paket 1000 HPK (Rp 500.000), atau nominal minimal Rp 10.000

### Fitur apa saja yang Anda coba? *

_(Checkbox — pilih semua yang sesuai)_

- [ ] Membuat akun (Register) sebagai Donatur
- [ ] Masuk ke aplikasi (Log in)
- [ ] Melakukan simulasi Donasi (memilih paket & menyelesaikan pembayaran Midtrans)
- [ ] Melihat ringkasan Dashboard Donatur (Total Donasi, Anak Terbantu, dll.)
- [ ] Melihat Riwayat Donasi dan status transaksi
- [ ] Melihat Laporan Dampak Donasi (grafik tren & distribusi)
- [ ] Menjelajahi fitur Langganan Donasi Bulanan

### Bukti Pengujian Aplikasi *

_(Upload File)_

Sebagai bentuk validasi pengujian, silakan unggah minimal 1 (satu) buah tangkapan layar (screenshot) saat Anda berhasil melakukan simulasi donasi atau saat berada di halaman Dashboard Donatur / Riwayat Donasi.

> **[Section Logic]:** → lanjut ke **Section 4: Penilaian Per-Task**

---
---

## Section 3B: Skenario Role Penerima Manfaat

**Deskripsi Section:**

Silakan buka aplikasi SeribuAsa melalui tautan berikut: **https://seribu-asa.vercel.app/**

Lakukan langkah-langkah eksplorasi berikut secara mandiri:

1. Buat akun baru (Register) dengan memilih peran sebagai **Penerima Manfaat**, atau masuk menggunakan akun yang sudah ada (Login).

2. Masukkan **data antropometri fisik anak** (berat badan dan tinggi badan) ke dalam sistem Pemantauan Gizi. Gunakan data dummy: Nama "Anak Testing", BB 9 kg, TB 75 cm.

3. Isi **Survei FIES** (Food Insecurity Experience Scale) untuk mengukur tingkat ketahanan pangan keluarga Anda.

4. Cek halaman **Dashboard Penerima Manfaat** untuk membaca hasil **peringatan prediksi gizi (AI Stunting)** berdasarkan data anak yang telah diinput.

5. Buka halaman **Rekomendasi AI** untuk melihat hasil analisis risiko stunting dan rekomendasi pangan dari sistem.

6. Kunjungi **Katalog Pangan**, pilih produk bergizi, dan tambahkan ke keranjang belanja.

7. Lakukan **Checkout pesanan** hingga sistem memunculkan **QR Code belanja** yang dapat digunakan untuk pengambilan di Vendor.

8. _(Opsional)_ Buka halaman **Dompet Nutrisi** untuk melihat saldo e-wallet dan riwayat transaksi.

**Data dummy yang dapat digunakan:**
- Email: testpenerima@gmail.com, Nama: "Penerima Testing"
- Data Anak: Nama "Anak Testing", Berat Badan 9 kg, Tinggi Badan 75 cm

### Fitur apa saja yang Anda coba? *

_(Checkbox — pilih semua yang sesuai)_

- [ ] Membuat akun (Register) sebagai Penerima Manfaat
- [ ] Masuk ke aplikasi (Log in)
- [ ] Menginput data pertumbuhan anak (Tinggi & Berat Badan)
- [ ] Mengisi Survei FIES (Ketahanan Pangan)
- [ ] Melihat hasil prediksi AI (Risiko Stunting) di Dashboard
- [ ] Melihat Rekomendasi AI Pangan
- [ ] Menjelajahi Katalog Pangan dan menambahkan produk ke keranjang
- [ ] Melakukan Checkout keranjang belanja hingga mendapat QR Code
- [ ] Mengakses Dompet Nutrisi (E-Wallet)

### Bukti Pengujian Aplikasi *

_(Upload File)_

Sebagai bentuk validasi pengujian, silakan unggah minimal 1 (satu) buah tangkapan layar (screenshot) yang menampilkan QR Code Belanja Anda setelah checkout, atau layar Peringatan Prediksi Risiko AI / Rekomendasi AI anak Anda.

> **[Section Logic]:** → lanjut ke **Section 4: Penilaian Per-Task**

---
---

## Section 3C: Skenario Role Mitra Vendor (Warung)

**Deskripsi Section:**

Silakan buka aplikasi SeribuAsa melalui tautan berikut: **https://seribu-asa.vercel.app/**

Lakukan langkah-langkah eksplorasi berikut secara mandiri:

1. Buat akun baru (Register) dengan memilih peran sebagai **Vendor**, atau masuk menggunakan akun yang sudah ada (Login).

2. **Tambah atau kelola stok barang** di menu Katalog Produk. Coba tambahkan produk baru dengan data dummy: Nama "Telur Ayam Dummy", Harga Rp 25.000, Stok 10.

3. Lakukan **simulasi pemindaian** menggunakan fitur kamera **QR Scanner** (atau masukkan kode QR secara manual) untuk memproses pesanan dari Penerima Manfaat.

4. Buka halaman **Dashboard Vendor** untuk melihat ringkasan pesanan dan statistik warung Anda.

5. Buka halaman **Settlement (Pencairan Dana)** untuk melihat riwayat transaksi, status pesanan, dan akumulasi pencairan dana Anda.

**Data dummy yang dapat digunakan:**
- Email: testvendor@gmail.com, Nama: "Vendor Testing"
- Nama Warung: "Warung Testing", Alamat: "Jl. Testing No. 1"
- Data Produk: Nama "Telur Ayam Dummy", Harga Rp 25.000, Stok 10

### Fitur apa saja yang Anda coba? *

_(Checkbox — pilih semua yang sesuai)_

- [ ] Membuat akun (Register) sebagai Mitra Vendor
- [ ] Masuk ke aplikasi (Log in)
- [ ] Mengelola / Menambah produk di Katalog Produk
- [ ] Mencoba pemindai kamera QR Scanner (atau input kode manual)
- [ ] Melihat Dashboard Vendor
- [ ] Memeriksa riwayat pesanan dan halaman Settlement (Pencairan Dana)

### Bukti Pengujian Aplikasi *

_(Upload File)_

Sebagai bentuk validasi pengujian, silakan unggah minimal 1 (satu) buah tangkapan layar (screenshot) saat Anda berada di halaman QR Scanner atau di halaman Riwayat Transaksi / Pencairan Dana (Settlement).

> **[Section Logic]:** → lanjut ke **Section 4: Penilaian Per-Task**

---
---

## Section 3D: Skenario Role Admin

**Deskripsi Section:**

Silakan buka dasbor admin SeribuAsa melalui tautan berikut: **https://seribu-asa.vercel.app/**

Untuk menguji role Admin, gunakan akun admin yang telah disediakan oleh tim penguji. Jika Anda tidak memiliki akun admin, silakan hubungi tim kami.

Lakukan langkah-langkah eksplorasi berikut secara mandiri:

1. Masuk (Login) ke aplikasi menggunakan **akun Admin** yang telah disediakan.

2. Buka halaman **Dashboard Admin** — lihat ringkasan statistik sistem: Total Pengguna, Total Donasi Terkumpul, Item Perlu Ditinjau, dan Pesanan Selesai. Perhatikan juga grafik komposisi pengguna (Donatur / Penerima / Vendor).

3. Buka **Kelola Pengguna** — lihat daftar pengguna berdasarkan role dan status. Coba lakukan Approve/Reject pada akun yang berstatus "Menunggu".

4. Buka **Kelola Produk** — lihat daftar produk per toko/vendor. Coba lakukan Approve/Reject pada produk berstatus "Pending".

5. Buka **Kelola Penerima Manfaat** — lihat data kelayakan, skor FIES, dan status verifikasi penerima manfaat.

6. Buka **Kelola Donasi** — pantau daftar seluruh donasi, status pembayaran, dan alokasi dana.

7. Buka **Kelola Pesanan** — lihat status pesanan (Menunggu / Selesai / Dibatalkan) dan detail pembayaran.

8. Buka **Sistem E-Wallet (Voucher)** — pantau jumlah dompet aktif, total saldo, total penukaran, dan nilai transaksi.

9. Buka **Laporan & Analitik** — lihat laporan komprehensif (KPI pengguna, metrik operasional, laporan regional, demografi). Coba ekspor data dalam format CSV.

### Fitur apa saja yang Anda coba di Admin Console? *

_(Checkbox — pilih semua yang sesuai)_

- [ ] Masuk ke aplikasi (Log in) sebagai Admin
- [ ] Melihat halaman Dashboard Admin
- [ ] Melihat atau mengelola data Pengguna (Approve/Reject akun)
- [ ] Melihat atau mengelola Produk Vendor (Approve/Reject produk)
- [ ] Melihat data Kelayakan Penerima Manfaat dan skor FIES
- [ ] Memantau daftar Donasi dan status alokasi
- [ ] Memantau daftar Pesanan dan status pembayaran
- [ ] Melihat Sistem E-Wallet / Voucher
- [ ] Melihat Laporan & Analitik dan mencoba ekspor CSV

### Bukti Pengujian Aplikasi *

_(Upload File)_

Sebagai bentuk validasi pengujian, silakan unggah minimal 1 (satu) buah tangkapan layar (screenshot) saat Anda berada di halaman Dashboard Admin, Laporan & Analitik, atau Kelola Pengguna.

> **[Section Logic]:** → lanjut ke **Section 4: Penilaian Per-Task**

---
---

## Section 4: Penilaian Per-Task (Completion Rate)

**Deskripsi Section:**

Berdasarkan skenario yang telah Anda jalankan di bagian sebelumnya, berikan penilaian untuk **setiap task** berikut ini.

Pilih salah satu status:
- **Berhasil tanpa bantuan** — Task dapat diselesaikan sendiri dengan mudah tanpa kendala.
- **Berhasil dengan bantuan** — Task berhasil diselesaikan, tetapi sempat bingung dan membutuhkan bantuan/arahan.
- **Tidak berhasil** — Task sudah dicoba, tetapi tidak dapat diselesaikan (error, tombol tidak bisa diklik, dll).
- **Tidak mencoba** — Task tidak dijalankan karena kendala tertentu atau dilewati.

### Task 1: Membuat akun baru (Register) atau masuk (Login) ke aplikasi *

_(Multiple Choice)_
- Berhasil tanpa bantuan
- Berhasil dengan bantuan
- Tidak berhasil
- Tidak mencoba

### Task 2: Menggunakan fitur utama sesuai role (Donasi / Input Data Anak / Kelola Produk / Dashboard Admin) *

_(Multiple Choice)_
- Berhasil tanpa bantuan
- Berhasil dengan bantuan
- Tidak berhasil
- Tidak mencoba

### Task 3: Menavigasi halaman Dashboard dan membaca informasi yang ditampilkan *

_(Multiple Choice)_
- Berhasil tanpa bantuan
- Berhasil dengan bantuan
- Tidak berhasil
- Tidak mencoba

### Task 4: Menyelesaikan alur transaksi (Pembayaran Donasi / Checkout Belanja / Scan QR / Approve-Reject) *

_(Multiple Choice)_
- Berhasil tanpa bantuan
- Berhasil dengan bantuan
- Tidak berhasil
- Tidak mencoba

### Task 5: Melihat riwayat/laporan (Riwayat Donasi / Rekomendasi AI / Settlement / Laporan Analitik) *

_(Multiple Choice)_
- Berhasil tanpa bantuan
- Berhasil dengan bantuan
- Tidak berhasil
- Tidak mencoba

### Jika ada task yang "Tidak berhasil", mohon jelaskan kendalanya secara singkat:

_(Paragraph — opsional)_

> **[Section Logic]:** → lanjut ke **Section 5: Kuesioner SUS**

---
---

## Section 5: Kuesioner SUS (System Usability Scale)

**Deskripsi Section:**

Berikan penilaian Anda terhadap kegunaan (usability) aplikasi SeribuAsa secara keseluruhan. Pilih satu angka dari skala 1 sampai 5 untuk setiap pernyataan berikut.

**Skala:** 1 = Sangat Tidak Setuju — 5 = Sangat Setuju

### SUS1. Saya pikir bahwa saya akan ingin lebih sering menggunakan aplikasi ini. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### SUS2. Saya merasa aplikasi ini terlalu rumit untuk digunakan. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### SUS3. Saya merasa aplikasi ini mudah digunakan. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### SUS4. Saya merasa membutuhkan bantuan dari orang teknis untuk dapat menggunakan aplikasi ini. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### SUS5. Saya merasa berbagai fungsi di aplikasi ini terintegrasi dengan baik. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### SUS6. Saya merasa ada terlalu banyak ketidakkonsistenan dalam aplikasi ini. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### SUS7. Saya membayangkan kebanyakan orang akan dapat mempelajari aplikasi ini dengan cepat. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### SUS8. Saya merasa aplikasi ini sangat tidak praktis untuk digunakan. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### SUS9. Saya merasa sangat percaya diri saat menggunakan aplikasi ini. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### SUS10. Saya perlu belajar banyak hal terlebih dahulu sebelum bisa menggunakan aplikasi ini. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

> **[Section Logic]:** → lanjut ke **Section 6: Kuesioner EUCS**

---
---

## Section 6: Kuesioner EUCS (End User Computing Satisfaction)

**Deskripsi Section:**

Berikan penilaian Anda terhadap kepuasan penggunaan aplikasi SeribuAsa berdasarkan 5 dimensi berikut. Pilih satu angka dari skala 1 sampai 5 untuk setiap pernyataan.

**Skala:** 1 = Sangat Tidak Setuju — 5 = Sangat Setuju

**— Dimensi: Content (Isi/Konten) —**

### C1. Aplikasi SeribuAsa menyediakan informasi yang sesuai dengan kebutuhan saya. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### C2. Isi informasi yang ditampilkan dalam aplikasi ini sudah memenuhi kebutuhan saya. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### C3. Aplikasi ini menyediakan laporan atau data yang sesuai dengan apa yang saya butuhkan. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

**— Dimensi: Accuracy (Akurasi) —**

### A1. Aplikasi SeribuAsa menghasilkan informasi yang akurat. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### A2. Saya puas dengan akurasi/ketepatan data yang ditampilkan oleh aplikasi ini. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

**— Dimensi: Format (Tampilan) —**

### F1. Tampilan informasi yang ditampilkan oleh aplikasi ini mudah dipahami. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### F2. Informasi yang ditampilkan aplikasi ini disajikan dalam format yang jelas dan rapi. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

**— Dimensi: Ease of Use (Kemudahan Penggunaan) —**

### E1. Aplikasi SeribuAsa mudah digunakan (user-friendly). *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### E2. Aplikasi ini memudahkan saya dalam menemukan informasi yang saya butuhkan. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

**— Dimensi: Timeliness (Ketepatan Waktu) —**

### T1. Aplikasi ini memberikan informasi yang saya butuhkan tepat waktu. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### T2. Aplikasi ini menyediakan informasi yang selalu up-to-date/terkini. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

### T3. Aplikasi ini merespons dan memberikan data dengan cepat sesuai kebutuhan saya. *

_(Linear Scale: 1 — 2 — 3 — 4 — 5)_

> **[Section Logic]:** → lanjut ke **Section 7: Feedback Tambahan**

---
---

## Section 7: Feedback Tambahan

**Deskripsi Section:**

Terima kasih telah menyelesaikan seluruh skenario dan kuesioner! Mohon berikan feedback tambahan Anda di bawah ini.

### Apakah ada fitur yang menurut Anda membingungkan atau sulit dipahami? Jika ya, jelaskan.

_(Paragraph — opsional)_

### Apakah Anda menemui error atau kendala teknis saat menggunakan aplikasi? Jika ya, jelaskan secara singkat.

_(Paragraph — opsional)_

### Apakah ada saran atau masukan tambahan untuk perbaikan aplikasi SeribuAsa?

_(Paragraph — opsional)_

> **[Section Logic]:** → Kirim formulir (selesai). Tampilkan pesan:
> "Terima kasih atas partisipasi Anda! Feedback Anda sangat berharga untuk perbaikan sistem SeribuAsa."

---
---

## Lampiran: Ringkasan Rute Aplikasi per Role (Referensi Internal Tim)

### Donatur
| Fitur | Rute |
|-------|------|
| Dashboard | `/dashboard/donor` |
| Riwayat Donasi | `/dashboard/riwayat` |
| Dampak Donasi | `/dashboard/dampak` |
| Langganan Donasi | `/dashboard/langganan` |
| Buat Donasi | `/donasi` → `/donation/checkout` → `/donation/create` |
| Profil | `/dashboard/profile` |

### Penerima Manfaat
| Fitur | Rute |
|-------|------|
| Dashboard | `/dashboard/beneficiary` |
| Pemantauan Gizi (Input Data Anak) | `/dashboard/pemantauan-gizi` |
| Survei FIES | `/dashboard/survei-fies` |
| Rekomendasi AI | `/dashboard/rekomendasi-ai` |
| Katalog Pangan | `/dashboard/katalog` |
| Keranjang Belanja | `/dashboard/cart` |
| Checkout | `/checkout` → `/checkout/success/:orderId` |
| Dompet Nutrisi (E-Wallet) | `/dashboard/dompet-nutrisi` |
| Profil | `/dashboard/profile` |

### Mitra Vendor
| Fitur | Rute |
|-------|------|
| Dashboard | `/dashboard/vendor` |
| Kelola Produk | `/dashboard/kelola-produk` |
| QR Scanner | `/dashboard/scan-qr` |
| Settlement (Pencairan Dana) | `/dashboard/settlement` |
| Profil | `/dashboard/profile` |

### Admin
| Fitur | Rute |
|-------|------|
| Dashboard | `/dashboard/admin` |
| Kelola Pengguna | `/dashboard/admin/users` |
| Kelola Produk | `/dashboard/admin/products` |
| Kelola Penerima Manfaat | `/dashboard/admin/beneficiaries` |
| Kelola Donasi | `/dashboard/admin/donations` |
| Kelola Pesanan | `/dashboard/admin/orders` |
| Sistem E-Wallet / Voucher | `/dashboard/admin/vouchers` |
| Laporan & Analitik | `/dashboard/admin/reports` |
