# Dashboard Dampak

Admin: `/dashboard/admin/impact`. Donatur: `/dashboard/dampak`.
Keduanya juga memiliki ringkasan seluruh periode pada halaman dashboard utama.

## Sumber dan definisi

Endpoint `GET /api/v1/reports/impact-dashboard` memakai tabel yang sudah ada;
tidak membutuhkan migrasi baru. Skema database harus sudah mengikuti migrasi
proyek, termasuk alokasi dana dan distribusi Faskes.

- Donasi berhasil: `donations.status = success` yang aktif, termasuk alur lama.
- Dana bersama: donasi berhasil dengan `funding_flow = pooled`.
- Dicadangkan: alokasi aktif dengan status `reserved`.
- Diterima Faskes: alokasi aktif dengan status `spent`, sesuai siklus penerimaan
  pesanan yang sudah ada. Ini bukan status pembayaran ke vendor.
- Diserahkan ke keluarga: hanya distribusi aktif dengan rincian barang aktif.
  Nilai aktual adalah jumlah barang × harga pada item pesanan, dibatasi nilai
  pesanan, dikalikan porsi pendanaan donasi pada pesanan tersebut. Perhitungan
  memakai Decimal; pembulatan dilakukan saat penyajian nominal rupiah.
- Keluarga dan Faskes terjangkau dihitung unik berdasarkan penyerahan tersebut.
  Keluarga bisa muncul di laporan beberapa donatur jika dibiayai bersama.
- Wilayah mengikuti kabupaten/kota profil Faskes saat laporan diambil. Wilayah
  yang belum dicatat ditampilkan sebagai "Belum tercatat".
- Donasi alur lama masuk total donasi dan tren, tetapi tidak diperkirakan
  penyalurannya melalui ledger dana bersama.

`start_date` dan `end_date` opsional memilih **tanggal pembuatan donasi** dalam WIB,
inklusif sampai akhir hari terakhir. Tanpa filter, laporan mencakup sejak awal
hingga hari ini. Status alokasi dan penyerahan adalah kondisi terbaru donasi
terpilih, bukan saldo historis pada akhir periode. Transaksi yang kemudian gagal,
dibatalkan, dikembalikan, atau dinonaktifkan tidak masuk laporan.

Dana bersama diterima = tersedia + dicadangkan + diterima Faskes. Nilai penyerahan
adalah bagian dari nilai diterima Faskes, sehingga tidak boleh dijumlahkan lagi.
Nilai/jumlah bantuan tidak menyatakan hubungan kausal dengan perbaikan gizi.
Dashboard tidak menampilkan angka perkiraan perbaikan gizi.

## Akses dan pembaruan

Admin mendapat agregat platform. Donatur dan corporate donor selalu dibatasi
ke ID akun terautentikasi; tidak ada parameter ID donatur dari klien. Peran lain
ditolak. Respons tidak memuat nama keluarga, KK, alamat, maupun bukti pribadi.
Tabel menampilkan maksimal 50 donasi berhasil terbaru, sedangkan ringkasan tetap
menghitung seluruh donasi terpilih.

Frontend memakai SWR dengan cache per pengguna dan filter, mengambil data tanpa
cache respons API lokal, memperbarui setiap 60 detik serta ketika jendela kembali
aktif. Tombol Perbarui tersedia. Kesalahan, data kosong, dan pemuatan memiliki
tampilan tersendiri. Grafik bulanan juga mempunyai daftar angka yang dapat dibuka.

## Verifikasi

Backend: jalankan dari `apps/backend`:

```sh
python -m pytest tests/test_impact_dashboard.py tests/test_facility_funding.py tests/test_facility_orders.py tests/test_facility_order_lifecycle.py -q
```

Frontend dari root:

```sh
npm run test:run --workspace frontend
npm run build --workspace frontend
```

Build produksi mengikuti validasi environment proyek yang sudah ada, termasuk
`VITE_API_BASE_URL` HTTPS berakhiran `/api/v1`. Konfigurasi development HTTP perlu
diganti dengan URL deployment yang benar saat merilis.

Uji manual: masuk sebagai donor, buka Dampak, pilih tanggal donasi, periksa
nominal dan status terhadap riwayat donasi. Buka sebagai admin dan cocokkan
dana tersedia/dicadangkan/diterima Faskes dengan pool dan pesanan. Catat
penyerahan sebagian barang melalui Faskes; nilai penyerahan harus bertambah
hanya sebesar bagian yang didanai donatur tersebut. Pada donasi bersama,
jumlah keluarga di laporan admin tetap satu per keluarga.
