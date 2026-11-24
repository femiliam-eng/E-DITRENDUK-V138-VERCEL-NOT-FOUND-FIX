# Revisi 3 November — source 31 Oktober

Dasar: REVISIAN27OKT26, dikoreksi REVISI29OKT26; tidak menghapus syarat 27 Oktober yang tidak diubah pada 29 Oktober.

## Perubahan pada paket ini
- Monitoring: kategori sesuai dokumen (FULLDAY, FULLBOARD, RAPAT DI KANTOR, RAPAT DI LUAR KANTOR, PERJALANAN DINAS, NARASUMBER), sambil mempertahankan kategori lama dari sumber data agar tidak hilang.
- Monitoring: filter Keuangan dan Direktur yang dapat digabungkan; pilihan Semua, Lengkap, Tidak lengkap, Belum diverifikasi.
- Monitoring: urut tanggal terbaru/terlama; mendukung ISO dan format tanggal DD/MM/YYYY.
- Repository: tombol dokumen tidak lagi diarahkan otomatis ke halaman Notulensi; jika sumber dokumen belum ada, tampilkan peringatan.
- Monitoring: tombol sinkronisasi tidak lagi menampilkan klaim sinkronisasi berhasil tanpa integrasi Google Drive.
- Penyimpanan: backendSave menolak API/ID yang tidak tersedia alih-alih berpura-pura berhasil.

## Batasan
- Ini belum seluruh revisi final. Integrasi database PostgreSQL milik pengguna, pengujian alur browser end-to-end, dan penautan dokumen sumber perlu diverifikasi.
