# FinanceKu

Aplikasi pencatatan keuangan pribadi (Expo + React Native), dikembangkan dari basis kode
POS-Offline. Fokus: mencatat pemasukan dan pengeluaran dengan sistem "kantong alokasi"
(mirip amplop/budget envelope), 100% offline memakai SQLite lokal (expo-sqlite).

## Fitur v2 (upgrade profesional)

- **Rekening (multi-akun)**: kelola beberapa "tempat uang" (Dompet, Bank, dll), tiap
  transaksi terhubung ke rekening tertentu sehingga saldo per rekening akurat.
- **Ringkasan bulanan bergrafik donut**: bandingkan pemasukan vs pengeluaran 2 bulan
  terakhir di Beranda, dan riwayat 12 bulan di Laporan.
- **Grafik pengeluaran 7 hari terakhir** (bar chart) dan **tren saldo** (line chart)
  di Beranda — dibangun dengan `react-native-svg`.
- **Form pengeluaran lengkap**: nominal, kepada/untuk, catatan, tanggal (geser hari/hari ini),
  pilih rekening, pilih kantong anggaran, dan status "Dicentang" (sudah diverifikasi).

## Fitur

- **Beranda**: kartu Total Saldo (saldo, terdialokasikan, belum dialokasi), akses cepat
  ke Atur Alokasi & Kelola Pemasukan, daftar sumber pemasukan, ringkasan alokasi bulan ini.
- **Kelola Pemasukan** (`app/pemasukan.tsx`): tambah sumber pemasukan (Gaji, Bonus, dll),
  tambah dana ke sumber yang sudah ada, hapus sumber.
- **Atur Alokasi** (`app/alokasi.tsx`): buat kantong/pos anggaran (Tabungan, Makan, dll),
  alokasikan dana dari saldo yang belum dialokasi ke kantong, hapus kantong.
- **Catat Pengeluaran** (`app/transaksi.tsx`, tombol + di Beranda): catat pengeluaran,
  pilih diambil dari kantong tertentu atau dari saldo umum.
- **Riwayat**: semua transaksi (pemasukan, alokasi, pengeluaran) + ekspor ke CSV.
- **Laporan**: ringkasan total pemasukan/alokasi/terpakai per bulan berjalan.
- **Pengaturan**: nama tampilan.

## Struktur data (SQLite)

- `income_sources` — sumber pemasukan (nama, ikon, warna, nominal awal, saldo berjalan)
- `allocations` — kantong/pos anggaran per periode bulan (`budget_amount`, `spent_amount`)
- `transactions` — jejak semua pergerakan uang (`income` | `allocation` | `expense`)

Lihat `services/database.ts` untuk skema & migrasi lengkap.

## Menjalankan

```bash
npm install
npx expo start
```

Untuk build APK, gunakan EAS Build seperti biasa (`eas build -p android`).

## Yang diubah dari POS-Offline

- Skema database diganti total (dari produk/transaksi kasir menjadi pemasukan/alokasi/pengeluaran).
- Store Zustand: `productStore`, `categoryStore`, `printerStore` dihapus; digantikan
  `incomeStore`, `allocationStore`, dan `transactionStore` yang ditulis ulang.
- Fitur printer thermal, scan barcode, dan manajemen produk POS dihapus.
- UI baru bergaya kartu saldo gelap + kantong alokasi (lihat `components/ui/balance-card.tsx`,
  `allocation-row.tsx`, `income-source-card.tsx`, `quick-action-card.tsx`).

## Build APK tanpa EAS (via GitHub Actions, gratis)

Repo ini sudah dilengkapi `.github/workflows/build-apk.yml` yang otomatis meng-generate
project Android native (`expo prebuild`) lalu build APK debug pakai Gradle di server GitHub
— tidak memakai kuota EAS build sama sekali.

### Cara pakai (dari Termux)

```bash
pkg install git
cd ~/FinanceKu
git init
git add .
git commit -m "Init FinanceKu"
git branch -M main
git remote add origin https://github.com/USERNAME/FinanceKu.git
git push -u origin main
```

Ganti `USERNAME` dengan akun GitHub kamu. Kalau repo `FinanceKu` di GitHub belum ada,
buat dulu (repo kosong, tanpa README) lewat github.com atau `gh repo create`.

Setelah push:
1. Buka repo di GitHub → tab **Actions**
2. Workflow **Build APK** akan otomatis jalan (atau klik **Run workflow** untuk trigger manual)
3. Tunggu sampai selesai (±5-10 menit)
4. Buka run yang sukses → bagian **Artifacts** → unduh `FinanceKu-debug-apk`
5. Extract zip-nya, dapat file `app-debug.apk`, tinggal install di HP

Catatan:
- APK ini **debug build** (pakai debug keystore otomatis dari Gradle) — cukup untuk
  pemakaian pribadi/testing, tapi belum di-sign untuk rilis ke Play Store.
- Kalau nanti mau APK release yang di-sign, tinggal minta bantuan generate keystore +
  update workflow-nya (assembleRelease + signing config).
