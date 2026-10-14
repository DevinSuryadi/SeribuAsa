# Implementasi pilihan daerah Vendor/Faskes di staging

Tanggal: 14 Oktober 2026. Audit dan gap utama: `STAGING_AUDIT_2026-10-14.md`.

## Perubahan yang dibuat

- Data wilayah lokal di `apps/backend/app/data/regions.json`: 38 provinsi dan 514 kota/kabupaten dari [Wilayah.id](https://wilayah.id/), versi data `2025-07-04`, berbasis kode Kemendagri. Sistem menyimpan **kode**, bukan nama, agar pilihan frontend dan validasi backend konsisten. Data ini perlu ditinjau dan diperbarui jika rujukan resmi berubah.
- Endpoint baca `GET /api/v1/regions/provinces` dan `GET /api/v1/regions/provinces/{province_code}/regencies` memberi isi dropdown bertingkat.
- Form tambah/edit produk Vendor mewajibkan provinsi dan kota/kabupaten layanan. Model dan API produk menyimpan dua kode wilayah; produk baru/yang diedit kembali berstatus pending sesuai review produk yang sudah ada.
- `GET /api/v1/facilities/catalog/vendors?province_code=...&regency_code=...` hanya mengembalikan Vendor aktif dan approved yang memiliki produk aktif, approved, stok positif di daerah itu. Katalog Faskes menampilkan vendor setelah memilih daerah, kemudian hanya produk vendor terpilih.
- `POST /api/v1/facilities/orders` memvalidasi ulang pasangan provinsi/kota, vendor terpilih, status vendor, dan semua produk. Kode wilayah disimpan sebagai snapshot order. Keranjang frontend dikosongkan ketika daerah atau Vendor berubah.
- Migrasi `a20261014regions` menambah kolom nullable pada `products` dan `orders`, constraint pasangan kode pada produk, dan indeks pencarian. Produk lama **tidak dihapus atau diberi wilayah hasil tebakan alamat**. Produk lama tanpa wilayah tidak muncul pada daftar Vendor per daerah sampai Vendor melengkapinya dan Admin menyetujui ulang.

## Berkas utama

- Backend: `app/services/regions.py`, `app/api/regions.py`, `app/api/products.py`, `app/api/facility_orders.py`, `app/services/product_service.py`, `app/models/product.py`, `app/schemas/product.py`, `app/main.py`, data JSON, dan migrasi Alembic.
- Frontend: `src/pages/dashboard/KelolaProduk.tsx`, `src/pages/dashboard/facility/FacilityCatalog.tsx`, `src/services/regions.ts`, `src/services/products.ts`, `src/services/facility-orders.ts`, `src/types/vendor.ts`, dan `src/hooks/useProducts.ts`.
- Tes: `tests/test_product_service.py` dan `tests/test_facility_orders.py`.

## Hasil verifikasi yang benar-benar dijalankan

| Pemeriksaan | Hasil |
|---|---|
| Backend `pytest -q` memakai Python dari virtualenv checkout lain dengan direktori kerja staging dan mode test SQLite | 239 passed, 55 warnings |
| Tes terarah produk + order Faskes sesudah perubahan terakhir | 14 passed, 8 warnings |
| Frontend `npm run test:run` | 67 passed, 1 todo |
| Frontend `npm run build` dengan lima variabel Vite dummy | Lulus; peringatan chunk besar |
| Frontend `npm run lint` | Exit 0, 0 error, 110 warning existing |
| Alembic `heads` dan SQL offline untuk revisi wilayah | Satu head `a20261014regions`; SQL penambahan kolom/indeks berhasil dibuat |
| `git diff --check` | Lulus |

Tidak ada migrasi diterapkan pada PostgreSQL produksi/staging, pembayaran nyata, atau push ke remote. Tes browser manual dengan akun Supabase Faskes/Vendor asli belum dilakukan.

## Cara menjalankan lokal

1. Siapkan Python 3.11 dan Node yang kompatibel. Di `apps/backend`, instal `requirements.txt` ke virtualenv lokal. Di `apps/frontend`, jalankan `npm ci`.
2. Isi konfigurasi lokal yang diperlukan dengan nama variabel dari `app/config.py` dan `vite.config.ts`; jangan commit nilai rahasia. `.env.example` sudah tercatat terhapus sebelum pekerjaan ini dan tidak diubah.
3. Jalankan migrasi **hanya pada database staging yang dicadangkan** setelah meninjau SQL: `python -m alembic heads`, lalu `python -m alembic upgrade head`. Jangan jalankan migrasi ini ke produksi tanpa rencana rilis.
4. Backend: dari `apps/backend`, `python -m uvicorn app.main:app --reload`. Frontend: dari `apps/frontend`, `npm run dev`.
5. Dengan Vendor approved, buka **Kelola Produk**, isi provinsi lalu kota/kabupaten, simpan dan minta approval produk. Dengan akun Faskes, buka **Katalog Pangan**, pilih provinsi lalu kota/kabupaten, pilih Vendor yang muncul, lalu pilih keluarga dan pesan produk. Produk lintas daerah atau Vendor tidak aktif ditolak oleh server.

## Batas BPR yang masih terbuka

Implementasi ini memenuhi revisi pemilihan wilayah tanpa QR pada jalur katalog Faskes. Audit menemukan proses BPR lain yang belum terpenuhi: approval alokasi sebelum order, penerimaan/pemeriksaan barang yang terpisah dari serah terima, pemisahan kewenangan Admin, vendor legal verification, payout berjenjang, dan penonaktifan mutasi pickup QR/checkout penerima lama. Karena itu aplikasi staging **belum** boleh dinyatakan memenuhi seluruh model To-Be. Detail bukti dan prioritas ada pada dokumen audit di atas.

Pembaruan berikutnya memisahkan penerimaan/pemeriksaan Faskes dan payout order Faskes dengan tenggat tiga hari. Lihat `STAGING_RECEIPT_PAYOUT_2026-10-14.md`; daftar gap pada paragraf di atas menggambarkan keadaan saat dokumen wilayah ini pertama ditulis.
