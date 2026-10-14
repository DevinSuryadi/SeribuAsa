# Audit alur BPR pada SeribuAsaStaging

Tanggal: 14 Oktober 2026. Cakupan: `D:\Kuliah\SeribuAsaStaging\SeribuAsa` pada branch `staging`.

## Sumber dan batas audit

- Dibaca: `README.md`, kode frontend/backend, model, migrasi Alembic, tes, diagram `Seribu-Hasa_Proses-Bisnis-Terbaru.svg`, `Seribu-Hasa_Admin-Lengkap.xlsx`, dan `Feature Gathering.xlsx` di `docs/bpr/references/`.
- Revisi pengguna pada 14 Oktober 2026 mengungguli rujukan lama tentang QR: Faskes memilih **provinsi → kota/kabupaten → vendor** yang melayani wilayah itu. Vendor menentukan wilayah layanan saat mengisi produk/katalog. Proses ini tidak menggunakan scan QR.
- Dokumen `BPR_GAP_ANALYSIS.md` dan laporan BPR lain yang sudah ada di folder ini belum dapat dianggap hasil audit staging. Dokumen itu menyebut `app/api/bpr.py`, `app/models/bpr.py`, revisi `bpr20261008`, dan dashboard BPR yang tidak ada di checkout ini. Berkas tersebut dibiarkan utuh karena sudah merupakan perubahan lokal yang belum dilacak Git.
- Status di bawah berdasarkan inspeksi kode, bukan klaim bahwa perilaku berhasil dijalankan terhadap PostgreSQL/Supabase produksi. Tes tidak dapat dijalankan saat audit awal karena dependensi Python `pytest` dan `apps/frontend/node_modules` belum tersedia.

## Alur yang benar-benar ada di staging

1. Donatur membuat donasi di `api/donations.py`. Donasi baru ditandai sebagai dana pool setelah pembayaran sukses; `OrderFundingAllocation` mengaitkan donasi dengan order Faskes.
2. Akun Faskes mendaftar lewat `POST /facilities/signup`, lalu mengelola satu fasilitas dan keluarga melalui `api/facility_families.py`; FIES dan pengukuran anak tercatat untuk keluarga yang dimiliki fasilitas.
3. Faskes membuka `FacilityCatalog.tsx`. Halaman ini mengambil `/products/` tanpa wilayah atau pilihan vendor dan menambahkan produk ke keranjang satu vendor.
4. `POST /facilities/orders` memeriksa keluarga, produk, stok, dan saldo pool; menyimpan order berstatus `pending`, mengurangi stok, dan mencadangkan dana **pada saat order dibuat**.
5. Vendor melihat order fasilitas miliknya dan menekan dispatch. Status menjadi `processing` tanpa langkah accept/preparing atau bukti kirim.
6. Faskes mengunggah bukti serah terima keluarga. Endpoint `/{order_id}/distribute` membuat tanda terima barang Faskes secara otomatis, mengubah order menjadi `completed`, dan mengubah dana cadangan menjadi spent. Tidak ada tahap pemeriksaan barang yang terpisah.
7. Endpoint checkout, voucher, pickup QR, serta navigasi penerima/vendor lama masih aktif. Settlement juga masih menghitung dari order completed dan mengkredit wallet vendor saat perhitungan.

## Perbandingan As-Is / To-Be

`Status akhir` adalah status pada saat audit ini, sebelum implementasi revisi wilayah dan perbaikan BPR berikutnya.

| ID | Aktor | Kebutuhan To-Be | Bukti implementasi saat ini | Status akhir | Gap dan dampak | Prioritas | FE diperlukan | BE diperlukan | DB diperlukan | Tes diperlukan |
|---|---|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Semua/Admin | Hak akses server, pemisahan verifikator/pengesah/auditor | `middleware/auth.py` memakai role tunggal; `api/admin.py` memakai `RequireRole(["admin"])` | PARTIAL | Persetujuan dan audit tidak punya separation of duties | Kritis | Navigasi sesuai kemampuan | Permission matrix, cek self-approval | Role/permission assignments | Uji 403 dan SoD |
| AUTH-02 | Semua | Akun istimewa tidak dapat berasal dari input pengguna | `api/users.py` menerima role signup; `middleware/auth.py` memakai fallback metadata dan dev mode saat konfigurasi Auth kosong | INCORRECT | Risiko eskalasi/peran demo di lingkungan salah konfigurasi | Kritis | Form registrasi dibatasi | Role dari sumber tepercaya, dev guard eksplisit | Kebijakan role | Uji pendaftaran dan konfigurasi produksi |
| DON-01 | Donatur | Donasi sukses membentuk dana bantuan yang dapat ditelusuri | `api/donations.py`, `api/funding.py`, `models/facility.py:OrderFundingAllocation` | PARTIAL | Pool dan tautan order ada; persetujuan alokasi belum ada | Kritis | Status alokasi donor | Reservasi sesudah approval | Alokasi dengan keputusan/aktor | Callback idempoten dan saldo |
| ADM-01 | Admin | Verifikasi legal/vendor dan aktivasi terpisah | `api/admin.py:update_user_approval`; `models/user.py:VendorProfile` hanya `approval_status` dan rekening | PARTIAL | NIB, dokumen, reviewer, lifecycle pemutakhiran/suspend belum ada | Kritis | Form verifikasi | Validasi dan keputusan berjenjang | Metadata verifikasi | Status/otorisasi |
| ADM-02 | Admin | Persetujuan alokasi sebelum vendor memproses/pencairan | `api/facility_orders.py:create_facility_order` langsung reserve; dispatch hanya cek reserved | NOT IMPLEMENTED | Vendor dapat mulai tanpa pengesahan Admin | Kritis | Antrian approval | State machine dan SoD | Request/alokasi/approval | Penolakan dan concurrent reserve |
| ADM-03 | Admin/Auditor | Monitoring, anomali, freeze, audit, rekonsiliasi | `api/admin.py` punya statistik/approval/export dan audit parsial | PARTIAL | Tidak ada case/freeze atau reconciliation dana→barang→penerima | Tinggi | Halaman monitoring | Case/freeze/reconcile | Tabel kasus/event | Akses auditor dan jejak akhir |
| VEN-01 | Vendor | Katalog dengan wilayah layanan provinsi→kota/kabupaten | `models/product.py:Product`, `schemas/product.py`, `api/products.py`, `KelolaProduk.tsx` tanpa kode wilayah | NOT IMPLEMENTED | Vendor di luar wilayah muncul dan bisa dipesan | Kritis | Dua dropdown berantai dan tampilkan daerah | Validasi kode dan filter area | Master wilayah serta relasi produk/wilayah | Region valid, filter, produk lama |
| VEN-02 | Vendor | Vendor terpilih sesuai daerah, terverifikasi, aktif | `FacilityCatalog.tsx` mengambil semua produk; `ProductService.get_products` hanya cek status produk | INCORRECT | Faskes tidak memilih vendor; vendor belum approved bisa muncul | Kritis | Daftar vendor setelah daerah, lalu produk vendor | Query vendor eligible dan object validation saat order | Indeks wilayah/status vendor | Vendor lintas wilayah/dinonaktifkan |
| VEN-03 | Vendor | Accept→prepare→dispatch dengan bukti pengiriman | `api/facility_orders.py:dispatch_facility_order` hanya `pending→processing` | PARTIAL | Tidak ada progres atau bukti kirim | Tinggi | Kontrol progres | Validasi transisi/evidence | Status/event kirim | Transisi salah/bukti |
| FAS-01 | Faskes | Akun/keluarga/FIES/gizi terikat fasilitas | `api/facilities.py`, `api/facility_families.py`, model facility dan tes terkait | PARTIAL | Kepemilikan keluarga ada, tetapi `current_facility` tidak mengecek `approval_status` | Tinggi | Tampilkan status persetujuan | Tolak fasilitas belum approved | Status sudah ada | Pending/rejected 403 |
| FAS-02 | Faskes | Penerimaan dan pemeriksaan barang terpisah dari serah terima | `api/facility_orders.py:distribute_order_to_family` membuat `FacilityOrderReceipt` otomatis | INCORRECT | Barang dapat dinyatakan diterima tanpa pemeriksaan Faskes | Kritis | Form terima/periksa dan serah terima | Dua endpoint/transisi terpisah | Receipt item, discrepancy, evidence | Kiriman kurang/rusak, tidak boleh distribute |
| FAS-03 | Faskes | Pilih provinsi→kota/kabupaten→vendor, tanpa QR | `FacilityCatalog.tsx` langsung katalog semua produk; `App.tsx` dan `DashboardLayout.tsx` masih menyediakan scanner Vendor lama | NOT IMPLEMENTED | Pemilihan wilayah tidak ada; alur lama masih terlihat | Kritis | Dropdown bertingkat, vendor list, hapus jalur QR operasional baru | Endpoint wilayah/vendor dan validasi order | Kode wilayah pada produk dan snapshot order | End-to-end pilih daerah/vendor |
| BEN-01 | Penerima | Hanya melihat status, jadwal, riwayat bantuan | `App.tsx` dan `DashboardLayout.tsx` masih memuat katalog/cart/checkout penerima; `api/orders.py`, `api/vouchers.py` masih menerima alur legacy | INCORRECT / LEGACY | Penerima dapat melewati Faskes | Kritis | Halaman pasif | Kunci mutasi legacy untuk transaksi baru | Migrasi status order lama | 410/403 direct checkout dan read-only history |
| PAY-01 | Vendor/Admin | Payout berbeda dari pemenuhan bantuan dan memerlukan persetujuan | `SettlementService.calculate_settlements` mengkredit wallet; `api/vendor_wallet.py:request_withdrawal` langsung completed | INCORRECT | Payout dapat selesai tanpa persetujuan/konfirmasi transfer yang layak | Kritis | Status permintaan/approval | Kontrol payout, idempotensi, SoD | Approval/transfer reference unik | Duplicate payout dan approval |
| REPORT-01 | Donatur/Admin | Laporan dana→order→receipt→handover tanpa data pribadi berlebih | `api/funding.py` memuat alokasi donor; `api/donations.py` memiliki metrik ID donor; laporan geografis punya placeholder | PARTIAL | Ownership dan laporan ujung-ke-ujung belum lengkap | Tinggi | Penanda status akurat | Scope donor dan agregasi | Referensi event | Privasi donor dan rekonsiliasi |
| UI-01 | Faskes | Data nyata atau empty state yang jelas | `FacilityDistributionHistory.tsx` dan `FacilityRedemptionHistory.tsx` menampilkan preview palsu bila data kosong pada mode DEV | PARTIAL | Demo dapat disangka riwayat nyata | Sedang | Label preview kuat atau hapus fallback | — | — | Empty state |

## Keputusan dan urutan implementasi

Skenario **B + C**: beberapa proses belum lengkap dan sebagian masih memakai alur lama. Revisi wilayah dapat diterapkan pada domain order Faskes yang sudah ada, tetapi keseluruhan BPR belum siap diklaim selesai.

1. Tetapkan master kode provinsi dan kota/kabupaten yang dapat diperbarui, dengan sumber/versi data terdokumentasi. Vendor mengaitkan wilayah layanan pada produk. Produk lama tanpa wilayah tetap tersimpan dan perlu dilengkapi; jangan menebak alamat menjadi kode wilayah.
2. Katalog Faskes: pilih provinsi, kota/kabupaten, lihat daftar vendor approved/aktif yang memiliki produk approved/aktif di wilayah tersebut, pilih vendor, lalu lihat produknya. Kosongkan keranjang bila wilayah/vendor berubah. Backend memvalidasi ulang kode dan kepemilikan produk pada saat order dibuat serta menyimpan snapshot wilayah.
3. Tambahkan approval alokasi Admin sebelum reservasi/dispatch, lalu proses penerimaan barang terpisah dan payout dengan kontrol. Aturan siapa yang berhak menyetujui dan kapan transfer bank terjadi harus diputuskan dari matriks kewenangan yang disahkan; spreadsheet hanya menjelaskan garis besar.
4. Matikan mutasi checkout/QR penerima untuk order BPR baru sambil mempertahankan riwayat transaksi lama. QR pencairan saldo Vendor adalah proses finansial berbeda dan perlu keputusan tersendiri.
5. Verifikasi pada database staging setelah migrasi ditinjau; jangan menerapkan migrasi pada produksi atau melakukan pembayaran nyata sebagai bagian dari audit.

## Verifikasi audit

- `git status --short` sebelum audit: dua `.env.example` tercatat terhapus dan `docs/bpr/` belum dilacak. Tidak ada file tersebut yang diubah dalam audit.
- Dependensi tes belum terpasang di checkout ini (`python -m pytest --version` gagal: modul tidak ada; `apps/frontend/node_modules` tidak ada). Angka lulus dalam `docs/bpr/BPR_TEST_RESULTS.md` berasal dari checkout lain dan **bukan** hasil tes staging ini.

## Implementasi sesudah audit pada hari yang sama

Revisi wilayah VEN-01, VEN-02, dan bagian pemilihan daerah/vendor pada FAS-03 sudah dikerjakan di staging. Hasil aktual, migrasi, dan cara verifikasi ada di `STAGING_REGION_IMPLEMENTATION_2026-10-14.md`. Status BPR lainnya pada matriks tetap terbuka; jalur QR lama masih ada dan tidak digunakan oleh katalog/order Faskes yang baru. Kata "Status akhir" di matriks mencatat keadaan **pada saat audit**, sebelum perubahan ini.

Pembaruan berikutnya: FAS-02 dan bagian pencairan khusus order Faskes pada PAY-01 telah diimplementasikan dengan batas `arrived_at + 72 jam`, approval Admin, dan referensi transfer. Detail status, migrasi, dan batas jaminan operasional ada di `STAGING_RECEIPT_PAYOUT_2026-10-14.md`. Jalur wallet/withdrawal lama tetap merupakan gap terpisah pada PAY-01.

ADM-02 kemudian ditangani untuk pesanan Faskes baru: permintaan menunggu persetujuan, reservasi dana terjadi saat Admin menyetujui, dan Vendor tidak dapat dispatch sebelumnya. Detailnya di `STAGING_ALLOCATION_APPROVAL_2026-10-14.md`.

AUTH-02 dan FAS-01 kemudian diperketat: peran Admin hanya dari `app_metadata` tepercaya, signup publik tidak dapat memilih Admin, mock auth memerlukan opt-in lokal, dan Faskes pending tidak dapat menggunakan API operasional. Admin memiliki halaman verifikasi Faskes. Lihat `STAGING_FACILITY_AUTH_2026-10-14.md` untuk langkah wajib migrasi hak Admin lama sebelum rilis.
