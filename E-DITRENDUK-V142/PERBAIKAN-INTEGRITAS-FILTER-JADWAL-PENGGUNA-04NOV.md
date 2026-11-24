# Revisi integritas — 4 November 2026

## Perbaikan yang diterapkan
- Menghapus filter/sort tambahan yang menduplikasi kontrol Monitoring dan RAKOM. Kontrol native tetap aktif; menghindari MutationObserver yang dapat menimpa urutan tabel.
- Menjaga nilai peran dan hak akses pengguna dari database walaupun tidak ada dalam pilihan bawaan, sehingga nilai asli tidak hilang ketika formulir dibuka.
- Jadwal memvalidasi tanggal dan minimal satu petugas sebelum POST/PATCH API.
- Form tambah pengguna mengunci tombol selama request dan memulihkannya saat selesai/gagal.
- Menambahkan 12 pemeriksaan regresi khusus perubahan ini.

## Batasan
- Belum dilakukan pengujian dengan koneksi PostgreSQL aktif atau dua akun pengguna.
- Persentase progres keseluruhan adalah estimasi, bukan hasil audit otomatis.
