# Konteks perubahan bisnis SeribuAsa

**Diperbarui:** 7 Oktober 2026  
**Status:** acuan kerja untuk perubahan bertahap; bukan klaim bahwa alur baru sudah selesai.  
**Sumber:** keputusan pemilik proyek dalam percakapan dan pemeriksaan kode pada branch `staging` tanggal tersebut. Jika kode berubah, periksa ulang bagian "Kondisi kode saat ini" sebelum mengerjakan kartu baru.

## Cara memakai dokumen ini di chat baru

Berikan tautan atau isi dokumen ini kepada asisten, sebutkan nomor kartu yang akan dikerjakan, lalu minta asisten membaca kode terbaru sebelum mengubahnya. Bagian **Keputusan tetap** adalah kebutuhan bisnis yang sudah disampaikan pemilik proyek. Bagian **Usulan desain** adalah arah implementasi yang masih boleh disesuaikan. Bagian **Keputusan terbuka** perlu disepakati sebelum implementasi yang bergantung padanya. Jangan menganggap usulan API/tabel di sini sudah ada di kode.

Contoh pesan pembuka:

> Baca `docs/KONTEKS_PERUBAHAN_BISNIS.md` dan periksa kode terbaru. Kerjakan kartu BE-003 pada branch yang berasal dari `staging`. Pertahankan keputusan bisnis dalam dokumen, jelaskan kontrak API dan migrasi yang diperlukan, implementasikan, lalu uji perubahan yang relevan. Jika menemukan keputusan terbuka yang menghalangi kartu ini, jelaskan pilihan dan dampaknya sebelum menetapkan perilaku final.

## 1. Tujuan dan keputusan tetap

SeribuAsa adalah aplikasi donasi bantuan pangan bagi masyarakat dengan kerentanan pangan, berfokus pada periode **1.000 hari pertama kehidupan (HPK)** untuk ibu hamil dan bayi/anak guna mendukung pencegahan stunting. Perubahan utama adalah perpindahan operasional dari penerima manfaat yang menggunakan aplikasi menjadi fasilitas kesehatan yang mengelola penerima dan pemesanan.

1. **Dana donasi terhimpun di SeribuAsa.** Admin dapat melihat dana masuk dan penggunaannya. Donasi tidak otomatis menjadi voucher/dompet milik penerima manfaat.
2. **Fasilitas kesehatan membuat pesanan makanan** dari vendor berdasarkan kebutuhan penerima yang didampinginya. Penerima manfaat **tidak memegang atau memakai aplikasi**.
3. **Vendor mengirim makanan ke fasilitas kesehatan.** Serah terima divalidasi dengan QR di fasilitas kesehatan. Ini berbeda dari QR lama yang dipakai vendor untuk mengonfirmasi pengambilan oleh penerima.
4. **Kebutuhan penerima berasal dari data dan survei yang diinput di fasilitas kesehatan.** Hasil asesmen perlu dapat ditinjau sebelum membuat pesanan.
5. **Donatur dapat melihat dampak personal dari dana yang ia sumbangkan:** siapa yang terbantu, foto jika diizinkan, grafik/riwayat bantuan, status kerentanan pangan terbaru, dan informasi relevan lainnya. Hubungan antara dana donatur dan penerima harus dapat ditelusuri walaupun dana dihimpun bersama. Data yang ditampilkan harus sesuai persetujuan dan hak akses.
6. Implementasi dilakukan **bertahap dalam dua sprint**. Target Sprint 1 adalah sekitar 50% perubahan bisnis dalam bentuk alur kerja yang dapat didemonstrasikan, bukan sekadar setengah jumlah halaman atau kartu.

## 2. Kondisi kode saat ini: alur lama

Ringkasan berikut berasal dari kode pada `staging`, bukan dari README lama yang masih menggambarkan sistem voucher.

| Area | Yang sudah ada | Konsekuensi untuk perubahan |
| --- | --- | --- |
| Arsitektur | React/TypeScript/Vite di `apps/frontend`, FastAPI/SQLAlchemy di `apps/backend`, PostgreSQL Supabase, autentikasi Supabase, migrasi Alembic di `apps/backend/alembic`. | Komponen dan layanan dapat dipakai ulang, tetapi kontrak dan otorisasi perlu disesuaikan. |
| Peran | Role yang dikenal: `donor`, `corporate_donor`, `beneficiary`, `vendor`, `admin`, `government`; lihat `app/schemas/user.py`, `app/middleware/auth.py`, dan `src/contexts/AuthContext.tsx`. | Belum ada role/profil **fasilitas kesehatan**. Saat ini `beneficiary` diperlakukan sebagai pengguna yang login. |
| Penerima | `UserProfile` dan `BeneficiaryProfile` terhubung lewat `user_id` (`app/models/user.py`); ada dashboard dan onboarding penerima. | Target memerlukan identitas/data penerima tanpa login, hubungan dengan fasilitas dan petugas, serta data ibu hamil/bayi yang diperlukan. |
| Donasi | `Donation` memiliki `recipient_id`; `DonationAllocationService.process_successful_donation()` memilih penerima menurut FIES dan mengisi wallet/voucher. Midtrans dan riwayat donasi sudah ada. | Alokasi otomatis ke saldo penerima harus diganti dengan pembukuan dana terhimpun. Dampak donatur tidak boleh disimpulkan dari `recipient_id` lama. |
| Asesmen | API FIES (`app/api/fies.py`) dan gizi (`app/api/nutrition.py`) sudah ada, tetapi banyak operasi menggunakan `current_user.user_id` sebagai penerima. | Input harus dilakukan petugas untuk penerima yang dipilih, dengan pembatasan akses per fasilitas. |
| Produk/vendor | Katalog, pengelolaan produk, vendor, dan sebagian proses settlement sudah tersedia. | Katalog dapat dipakai untuk pemesanan fasilitas; settlement harus mengikuti bukti penerimaan yang baru. |
| Pesanan/QR | `OrderService` membuat pesanan dari akun penerima, menahan saldo wallet, dan membuat `pickup_qr_code`; vendor memindai QR penerima untuk menyelesaikan pickup. | Pembuat pesanan, sumber dana, tujuan pengiriman, status, pelaku validasi QR, dan pencatatan serah terima perlu berubah. |
| FE | Ada dashboard donatur, penerima, vendor, admin; halaman FIES, pemantauan gizi, katalog, dompet, checkout, dan pemindai QR vendor. Lihat `src/App.tsx`. | Halaman lama bisa menjadi bahan adaptasi, tetapi navigasi dan alur penerima tidak boleh dianggap sebagai alur target. |
| Laporan donor | Metrik dampak dan riwayat donasi sudah ada berdasarkan model lama. | Belum ada atribusi dana terhimpun ke pesanan/penerima dan aturan privasi untuk tampilan personal. |

**Catatan keamanan saat mengembangkan:** `app/middleware/auth.py` memakai mock auth bila `DEV_MODE=true` atau konfigurasi Supabase auth tidak lengkap. `app/config.py` memakai SQLite memori bila `DATABASE_URL` tidak ada atau mode tes aktif. Pastikan mode dan database yang dipakai sesuai sebelum menguji alur nyata.

## 3. Alur bisnis target

```text
Donatur membayar donasi
  -> pembayaran tervalidasi
  -> dana dicatat sebagai dana terhimpun SeribuAsa
  -> admin memantau saldo dan penggunaan

Petugas fasilitas kesehatan login
  -> mencatat ibu hamil/bayi tanpa akun penerima
  -> menginput data, survei FIES, dan pengukuran relevan
  -> meninjau kebutuhan bantuan
  -> memilih vendor dan produk
  -> membuat pesanan untuk penerima yang didampingi

Vendor menerima dan menyiapkan pesanan
  -> vendor mengirim ke fasilitas kesehatan
  -> QR divalidasi saat fasilitas menerima barang
  -> penerimaan tercatat; dana/pembayaran vendor diproses sesuai aturan
  -> fasilitas menyalurkan bantuan ke penerima dan mencatat realisasinya

Donatur login
  -> melihat donasi miliknya dan penerima yang benar-benar terbantu
  -> melihat foto yang diizinkan, riwayat/grafik bantuan, dan status FIES terbaru
```

**Batas penting:** validasi QR saat vendor menyerahkan barang ke fasilitas dan pencatatan bantuan dari fasilitas ke penerima adalah dua peristiwa berbeda. Jangan menyamakan "barang diterima fasilitas" dengan "penerima sudah menerima bantuan". Jika grafik donatur menampilkan bantuan tersalurkan, sumber datanya harus peristiwa penyaluran yang tercatat.

## 4. Perubahan yang diperlukan per domain

### 4.1 Identitas, peran, dan akses

- Tambahkan akun petugas dan profil fasilitas kesehatan; tentukan apakah satu petugas bisa berada di lebih dari satu fasilitas (**keputusan terbuka**).
- Penerima manfaat menjadi data yang dikelola fasilitas, tanpa kewajiban email, password, Supabase Auth, atau dashboard sendiri.
- Admin mengelola persetujuan/aktivasi fasilitas sesuai kebijakan; vendor tetap mengelola katalog dan pesanan yang menjadi miliknya; donatur hanya melihat donasi dan dampak miliknya.
- Otorisasi di backend harus memeriksa fasilitas pemilik data. Menyembunyikan tombol di frontend saja tidak cukup.
- Periksa semua endpoint lama yang menganggap `current_user` adalah penerima: users/onboarding, FIES, nutrisi, cart, wallet/voucher, order, QR, rekomendasi, dan laporan. Alihkan, batasi, atau nonaktifkan setelah jalur baru siap.

### 4.2 Data penerima dan asesmen

- Catat identitas minimal ibu hamil/bayi, hubungan keluarga/pendamping, fasilitas penanggung jawab, status aktif, dan persetujuan penggunaan data/foto. Daftar field rinci perlu disahkan bersama stakeholder.
- Simpan survei FIES bertanggal, hasil perhitungan, petugas penginput, dan riwayatnya. Status "sekarang" pada donor harus memakai asesmen terbaru **beserta tanggalnya**, bukan label tanpa konteks waktu.
- Simpan pengukuran ibu/anak yang relevan untuk 1.000 HPK dan riwayatnya. Fitur z-score/risiko yang ada perlu diperiksa kesesuaiannya dengan data baru; jangan menyajikan hasil algoritme sebagai diagnosis klinis.
- Simpan kebutuhan pangan atau rencana bantuan yang ditetapkan fasilitas beserta dasar asesmen dan waktu berlakunya. Hasil FIES bukan daftar makanan otomatis; keputusan pangan tetap memerlukan aturan/program yang disepakati.

### 4.3 Donasi, dana terhimpun, dan atribusi donatur

- Donasi yang sukses menambah dana tersedia **sekali**; webhook pembayaran berulang tidak boleh menggandakan saldo. Pembatalan/refund harus tercatat sebagai koreksi yang dapat diaudit.
- Pisahkan **pembukuan uang** (dana masuk, reservasi, penggunaan, pengembalian) dari **atribusi dampak** (donasi mana dikaitkan dengan bantuan/penerima mana). Keduanya terkait, tetapi tidak sama dengan dompet penerima.
- Pesanan tidak boleh membelanjakan dana melebihi dana yang tersedia. Definisikan kapan dana direservasi, kapan menjadi pengeluaran, dan kapan dilepas lagi jika pesanan batal.
- Siapkan relasi yang dapat diaudit dari donasi -> kontribusi pendanaan pesanan -> penerima -> realisasi bantuan. Atribusi harus mencegah satu rupiah atau satu bantuan dihitung dua kali. Metode atribusi (misalnya FIFO atau proporsional) **belum diputuskan**; jangan mengklaim setiap donatur membiayai seluruh pesanan yang sama.
- Admin melihat pemasukan, reservasi, pengeluaran, saldo, pesanan terkait, dan riwayat koreksi. Donatur melihat riwayatnya sendiri serta dampak yang dapat dibuktikan, bukan laporan keuangan internal admin.

### 4.4 Pesanan, pengiriman, QR, penyaluran

- Pesanan dibuat petugas fasilitas untuk penerima yang didampinginya, memilih produk vendor yang tersedia dan sesuai kebutuhan. Simpan snapshot item/harga, fasilitas tujuan, penerima/kelompok penerima, pembuat pesanan, dan sumber dana.
- Tetapkan status yang membedakan pesanan dibuat, diterima vendor, dikirim, diterima fasilitas, dibatalkan, dan bantuan disalurkan. Nama status final dan aturan transisinya masih perlu disepakati.
- QR target adalah bukti serah terima vendor -> fasilitas: token acak, terkait pesanan/fasilitas, kedaluwarsa, sekali pakai, diverifikasi server, dan tercatat siapa serta kapan memvalidasi. **Siapa yang menampilkan dan memindai QR** masih perlu diputuskan; penerima tidak terlibat.
- Pencatatan penyaluran fasilitas -> penerima diperlukan bila aplikasi hendak menampilkan bantuan yang benar-benar diterima, bukan sekadar pesanan atau pengiriman.
- Ubah settlement/vendor wallet agar pembayaran mengikuti peristiwa yang disetujui. Jangan melepas pembayaran hanya karena QR pickup lama tervalidasi.

### 4.5 Donor impact dan privasi

- Donatur melihat daftar penerima yang terbantu oleh kontribusinya sesuai metode atribusi yang disahkan, dengan nominal/proporsi kontribusi yang jujur bila dana dihimpun bersama.
- Profil yang boleh ditampilkan: identitas terbatas atau nama samaran, foto jika ada persetujuan, fasilitas/area pada tingkat yang diizinkan, status FIES terbaru dan tanggalnya, serta riwayat bantuan yang benar-benar tersalurkan. Rincian publikasi harus disetujui stakeholder dan penerima/wali.
- Bedakan grafik **bantuan** (tanggal, jenis, frekuensi/kuantitas) dari grafik **pertumbuhan/gizi**. Pengukuran gizi yang sensitif tidak otomatis boleh ditampilkan kepada donatur.
- Foto dan data sensitif perlu mekanisme persetujuan, perubahan/penarikan persetujuan, akses terbatas, dan fallback tanpa foto. Hindari NIK, alamat lengkap, kontak, dan data kesehatan mentah pada respons donor.

## 5. Peta implementasi: sudah ada, diubah, dan ditambah

| Modul | Pertahankan/adaptasi | Ubah atau hentikan pada alur baru | Belum ada; perlu dibuat |
| --- | --- | --- | --- |
| Auth | Supabase Auth, login donor/vendor/admin | Onboarding penerima dan pemeriksaan role lama | Role fasilitas, membership petugas, RBAC per fasilitas |
| Penerima | Sebagian model profil, data anak, admin review | Ketergantungan pada akun penerima | Registrasi tanpa login, pengampu fasilitas, data ibu hamil, persetujuan |
| Asesmen | Kalkulator FIES, pengukuran/z-score, riwayat | Input hanya untuk `current_user` penerima | Input oleh petugas untuk ID penerima, audit petugas, ringkasan kebutuhan |
| Donasi | Pembayaran Midtrans, subscription, riwayat | `recipient_id` sebagai sumber dampak, auto wallet/voucher allocation | Pool/ledger dana, saldo admin, atribusi donatur ke bantuan |
| Katalog | Produk, stok, persetujuan vendor/admin | Keranjang milik penerima | Pemilihan produk oleh fasilitas menurut kebutuhan |
| Pesanan | Model item, layanan pesanan, status dasar | Pemesan penerima, wallet hold, QR pickup | Fasilitas tujuan, reservasi pool, status pengiriman/penerimaan/penyaluran |
| QR/vendor | Pemindai QR lama, settlement/vendor wallet | QR penerima yang dipindai vendor | QR serah terima di fasilitas, bukti penerimaan, aturan payout baru |
| Dashboard | Donor/admin/vendor dan komponennya | Dashboard/dompet/katalog penerima | Dashboard fasilitas, laporan pool admin, dampak personal donor berbasis atribusi |

Nama tabel, nama endpoint, dan cara mempertahankan data lama **bukan keputusan final**. Implementasi harus memakai migrasi Alembic yang dapat ditinjau; jangan menghapus tabel atau data lama hanya karena tidak dipakai pada alur target.

## 6. Arah API dan database (usulan desain, belum terimplementasi)

Kontrak ini adalah daftar kemampuan, bukan perintah memakai URL persis berikut. Samakan pola penamaan dengan API `/api/v1` yang sudah ada sebelum coding.

| Kemampuan API target | Akses | Contoh respons/aksi penting |
| --- | --- | --- |
| Profil dan petugas fasilitas | Admin/fasilitas | Identitas fasilitas, status aktif, anggota yang berwenang |
| CRUD penerima milik fasilitas | Fasilitas/admin | ID penerima mandiri, status, pengampu fasilitas, persetujuan |
| Input/riwayat FIES penerima | Fasilitas/admin | Skor, klasifikasi, tanggal, penginput |
| Input/riwayat pengukuran | Fasilitas/admin | Nilai, tanggal, hasil perhitungan, penginput |
| Ringkasan kebutuhan | Fasilitas/admin | Asesmen terbaru, kebutuhan yang disetujui, tanggal berlaku |
| Dana terhimpun | Admin | Total masuk/tersedia/direservasi/terpakai, mutasi |
| Pesanan fasilitas | Fasilitas; vendor melihat miliknya | Penerima, vendor, item, jumlah, status, reservasi |
| Konfirmasi serah terima QR | Fasilitas dan vendor sesuai keputusan QR | Validasi satu kali, status penerimaan, audit |
| Catatan penyaluran | Fasilitas/admin | Bantuan yang benar-benar diserahkan ke penerima |
| Dampak donatur | Donatur pemilik donasi | Penerima teratribusi, bantuan, status terkini yang diizinkan |

Entitas yang kemungkinan perlu ditambah/diubah: profil fasilitas dan keanggotaan petugas; identitas penerima tanpa auth; data ibu hamil/anak dan asesmen; kebutuhan/rencana bantuan; ledger dana dan reservasi; atribusi donasi-pesanan-penerima; pesanan dengan fasilitas tujuan; bukti pengiriman/penerimaan QR; catatan penyaluran; persetujuan foto/data; serta audit perubahan. Pastikan relasi dan indeks mendukung akses per fasilitas dan donatur tanpa membocorkan data lintas akun.

## 7. Tahapan implementasi dan ketergantungan

### Sprint 1: fondasi dan pesanan oleh fasilitas

Target demonstrasi: petugas fasilitas login, mendaftarkan penerima tanpa akun, mengisi FIES/pengukuran, melihat kebutuhan, membuat pesanan ke vendor, dan admin melihat dana terhimpun serta dana yang direservasi. Donasi baru tidak lagi otomatis mengisi wallet penerima. Jika sebagian jalur UI belum selesai, statusnya harus dicatat; jangan mengklaim alur target sudah lengkap.

| Urutan | Team Lead | Backend | Frontend |
| --- | --- | --- | --- |
| 1 | TL-001 aturan peran, persetujuan, dan alur; TL-002 kontrak API/migrasi | BE-001 skema fasilitas/penerima; BE-007 ledger dana dapat dirancang paralel | FE-001 routing role dan rancangan halaman fasilitas |
| 2 | Review migrasi dasar dan kontrak | BE-002 auth/RBAC; BE-003 CRUD penerima | FE-002 dashboard fasilitas; FE-003 daftar/form penerima |
| 3 | Integrasi asesmen | BE-004 FIES; BE-005 pengukuran; BE-006 ringkasan kebutuhan | FE-004 FIES; FE-005 pengukuran; FE-006 kebutuhan |
| 4 | TL-003 uji alur lintas peran | BE-008 pesanan fasilitas + reservasi dana | FE-007 pemesanan fasilitas; FE-008 donasi terhimpun/admin |

Nomor kartu merujuk pada backlog Trello yang sudah disusun dalam percakapan. Urutan ini menunjukkan ketergantungan, bukan kewajiban mengerjakan setiap baris secara serial. Dua developer BE harus menghindari migrasi basis data yang saling bertentangan. Dua developer FE dapat mulai dari kontrak/mocks lalu integrasi ke API setelah kontrak disepakati.

### Sprint 2: penyelesaian alur dan dampak donor

Lanjutkan penerimaan vendor di fasilitas, QR serah terima, bukti penyaluran ke penerima, settlement yang sesuai, atribusi dana ke bantuan nyata, dashboard dampak personal donor, persetujuan/privasi, laporan, dan penghapusan atau penutupan alur lama. Uji keadaan gagal: donasi gagal/refund, dana kurang, stok berubah, pesanan batal, QR kedaluwarsa/dipakai ulang, kiriman sebagian, penerima dipindahkan fasilitas, serta persetujuan foto ditarik. Pembagian kartu Sprint 2 perlu difinalkan setelah hasil Sprint 1 dan keputusan terbuka diselesaikan.

## 8. Cara kerja repo dan lingkungan pengembangan

- Branch integrasi adalah `staging`. Untuk pekerjaan baru, buat `feature/...` dari `staging` terbaru dan ajukan PR kembali ke `staging`; setelah alur teruji, PR `staging` ke `main`. Jangan membuat dua implementasi skema yang berlomba pada tabel yang sama.
- Pengembangan dilakukan lokal; Vercel/Railway tidak diperlukan untuk menjalankan fitur saat coding. Workflow GitHub Actions di `.github/workflows` memeriksa build/lint/tes; keberadaan CI tidak berarti alur bisnis baru sudah teruji.
- Tim memilih **satu database Supabase yang sama** untuk pengembangan karena deployment di `main` tidak lagi dipakai. Tetap cadangkan database sebelum migrasi, terapkan migrasi terurut, dan hindari seed dengan `--reset` pada database bersama. Migrasi bersifat aditif dahulu; hapus struktur lama hanya setelah data dan kode baru terverifikasi.
- Backend lokal harus memakai `DATABASE_URL` dan konfigurasi Supabase yang benar dengan `DEV_MODE=false`, `TEST_MODE=false`, `SCHEDULER_ENABLED=false` saat mengakses database bersama. Nilai `VITE_` pada frontend dapat dibaca browser; jangan menaruh service-role key, password database, atau Midtrans server key di sana. File env nyata tetap diabaikan Git.
- Tes backend yang menggunakan SQLite memori tidak membuktikan bahwa migrasi PostgreSQL atau transaksi pembukuan dana berjalan pada database bersama. Tambahkan verifikasi yang relevan untuk migrasi dan alur finansial sebelum menggabungkan fitur tersebut.

## 9. Keputusan terbuka yang harus dicatat, bukan ditebak

1. Jenis fasilitas yang didukung dan apakah satu petugas dapat bekerja di beberapa fasilitas.
2. Data wajib ibu hamil/bayi, batas usia/kelayakan 1.000 HPK, dan apakah satu pesanan boleh untuk banyak penerima.
3. Siapa yang menyetujui penerima dan rencana kebutuhan: fasilitas saja atau juga admin.
4. Aturan menentukan jenis/jumlah makanan dari asesmen; siapa yang memiliki keputusan akhir.
5. Kapan dana direservasi dan dibukukan sebagai terpakai; bagaimana refund, pesanan sebagian, biaya admin, dan pembayaran vendor dihitung.
6. Metode atribusi dana terhimpun ke donatur/penerima (FIFO, proporsional, atau kebijakan lain) serta kapan dampak dianggap sah.
7. Pihak yang menampilkan dan memindai QR di fasilitas, masa berlaku, serta prosedur jika tidak ada koneksi atau barang tidak sesuai.
8. Bukti penyaluran ke penerima: siapa mencatat, data apa yang diperlukan, dan apakah penerima/wali menandatangani secara offline.
9. Format persetujuan foto/data, nama samaran, jangkauan informasi yang boleh dilihat donatur, serta cara menarik persetujuan.
10. Perlakuan data lama: donasi, saldo wallet/voucher, pesanan pickup, akun penerima, dan laporan historis. Perlu strategi migrasi/arsip yang menjaga jejak audit.

Jika keputusan ini belum ada, implementasi yang bergantung padanya boleh memakai rancangan sementara hanya setelah diberi label jelas dan dikonfirmasi pemilik proyek. Jangan mengubah keputusan tetap pada bagian 1 demi menyesuaikan kode lama.
