# Penerimaan barang Faskes dan pencairan Vendor di staging

Tanggal: 14 Oktober 2026. Berlaku untuk `order_flow=facility_delivery` di `D:\Kuliah\SeribuAsaStaging\SeribuAsa`.

## Aturan dan alur

1. Vendor mengirim pesanan. Server mencatat `orders.dispatched_at` dan status `processing`.
2. Faskes mengisi waktu barang **tiba**, memeriksa seluruh barang, dan mengonfirmasi penerimaan dari halaman Pesanan. Server menolak waktu kedatangan sebelum dispatch atau di masa depan.
3. Bila ada barang kurang, rusak, atau tidak sesuai, Faskes wajib menulis catatan. Receipt berstatus `discrepancy`; penyaluran ke keluarga dan pencairan tidak dapat dilanjutkan. Vendor melihat catatan dan melengkapi barang. Faskes dapat memeriksa ulang, memakai waktu kedatangan awal yang sudah tercatat.
4. Saat Faskes menyatakan lengkap, receipt menjadi `accepted`, order `received`, dan satu `FacilityVendorPayout` berstatus `pending_approval` dibuat. `due_at = arrived_at + 72 jam` (tiga hari penuh sejak barang tiba), termasuk jika Faskes terlambat mengonfirmasi. Konfirmasi ulang tidak membuat payout kedua.
5. Admin melihat antrean diurutkan menurut jatuh tempo dan penanda `overdue`. Admin memeriksa receipt, status vendor, rekening bank, dan dana yang dicadangkan, lalu menyetujui. Persetujuan hanya membuat status `approved`; **tidak memindahkan uang**.
6. Setelah transfer bank dilakukan di luar aplikasi, Admin memasukkan referensi dan waktu transfer sebenarnya. Server menolak pencatatan tanpa persetujuan, transfer di masa depan, dan referensi yang sudah digunakan. Pencatatan ini mengubah payout dan `orders.payment_status` menjadi `paid`, serta mengubah alokasi donasi `reserved` menjadi `spent` dalam satu transaksi database. `late` dihitung dari waktu transfer sebenarnya versus jatuh tempo. Waktu pencatatan terpisah disimpan sebagai `recorded_at`.
7. Serah terima kepada keluarga adalah langkah terpisah. Faskes hanya dapat mencatat distribusi bila receipt `accepted`; bukti foto dan penerima tetap wajib. Distribusi tidak mengubah status pembayaran Vendor.

## Batas dan migrasi

- Ini adalah **pencatatan transfer manual**, bukan integrasi bank. Antrean dan penanda lewat tenggat membantu Admin memenuhi batas tiga hari, tetapi aplikasi tidak dapat menjamin bank benar-benar mentransfer tepat waktu. Kasus terlambat tetap dicatat apa adanya; sistem tidak menyembunyikannya dengan menolak transaksi lewat tenggat.
- Pembaruan sesudah dokumen ini: dana pool sekarang dicadangkan **sesudah Admin menyetujui alokasi**, sebelum Vendor dapat memproses pesanan. Lihat `STAGING_ALLOCATION_APPROVAL_2026-10-14.md`. Verifikasi legal Vendor yang lebih rinci, pemisahan jabatan Admin, dan penutupan jalur checkout/QR lama masih merupakan gap BPR pada `STAGING_AUDIT_2026-10-14.md`.
- Settlement wallet/voucher lama hanya menghitung `legacy_pickup`; pesanan Faskes baru memakai tabel payout khusus dan tidak mengkredit wallet Vendor. Ini menghindari pencairan ganda lintas dua mekanisme.
- Migrasi `a20261014payout` bergantung pada `a20261014regions`, lalu diikuti `a20261014allocation`. Migrasi payout menambah waktu dispatch, metadata receipt, dan tabel payout dengan `order_id` serta `transfer_reference` unik. Receipt lama dibiarkan dengan `arrived_at=NULL`, karena receipt itu dahulu dibuat otomatis saat penyaluran keluarga dan **tidak membuktikan waktu barang tiba**. Tidak ada payout otomatis untuk order lama.
- Migrasi belum diterapkan ke PostgreSQL/Supabase. Jalankan hanya sesudah meninjau backup serta SQL migrasi pada database staging. Uji manual dengan akun Faskes, Vendor, dan Admin yang sungguhan masih diperlukan.

## Titik implementasi

- Backend: `app/api/facility_orders.py`, `app/api/facility_payouts.py`, `app/models/facility.py`, `app/models/product.py`, `app/services/facility_funding.py`, `app/services/settlement_service.py` dan migrasi `a20261014_facility_receipts_payouts.py`.
- Frontend: Pesanan Faskes dan dialog konfirmasi barang tiba, Bantuan & Riwayat untuk bukti keluarga, Pesanan Faskes Vendor, serta halaman Pencairan Faskes untuk Admin dan Vendor.
- Tes utama: `tests/test_facility_orders.py` mencakup konfirmasi tidak sah, discrepancy, tidak boleh distribusi sebelum diterima, batas 72 jam, Vendor dibekukan, persetujuan, transfer, idempotensi, stok, dan rekonsiliasi dana.

## Verifikasi yang dijalankan

| Pemeriksaan | Hasil |
|---|---|
| Backend `pytest -q` pada staging (Python virtualenv checkout lokal lain, mode SQLite test) | 243 passed, 55 warnings setelah pembaruan persetujuan dan otorisasi |
| Frontend `npm run test:run` | 67 passed, 1 todo |
| Frontend `npm run build` dengan variabel Vite dummy | Lulus |
| Frontend `npm run lint` | Lulus |
| Alembic `heads`, SQL offline revisi `a20261014regions:a20261014payout` | Satu head, SQL berhasil dibuat |

Tes tidak menjalankan transfer nyata atau migrasi ke database jaringan.
