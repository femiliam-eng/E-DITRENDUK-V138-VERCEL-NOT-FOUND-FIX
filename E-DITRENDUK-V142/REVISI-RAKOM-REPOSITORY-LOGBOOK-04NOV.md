# Revisi lintas modul — 4 November 2026

Source: paket E-DITRENDUK 31 Oktober, meneruskan revisi Beranda/Repository/Monitoring sebelumnya.

- RAKOM: pencarian tim/arahan/PIC/deadline; filter status dan pengurutan tanggal tetap bekerja bersama; tanggal format DD/MM/YYYY dapat diurutkan secara kronologis; kontrol filter tidak diduplikasi saat halaman dimuat ulang; status In Progress mempertahankan progres sebelumnya (dibatasi 1–99%).
- Repository: pencarian nama/tim/kategori/status, dapat dikombinasikan dengan filter chip; URL dokumen diparsing dan dibatasi ke HTTP(S).
- Logbook: perbaikan penting: handler lama mengganti seluruh tabel sebelum event penyimpanan API dapat berjalan. Handler status lama dihapus dan penyimpanan status memakai event delegation, sehingga status setelah pencarian/filter tidak lagi hanya berubah di tampilan.
- Arsip: handler status lama yang mengubah data lokal sebelum permintaan API dihapus. Event delegation menyimpan dahulu dan rollback pilihan jika server gagal.

## Verifikasi
- `node --check js/app.js`
- `npm run frontend-test` (15 halaman)
- `unzip -t` pada ZIP rilis

## Belum diuji
Browser end-to-end dan koneksi PostgreSQL/Supabase aktif. Belum deploy ke Vercel sesuai permintaan pengguna.
