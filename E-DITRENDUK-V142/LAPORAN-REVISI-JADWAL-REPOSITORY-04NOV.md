# Revisi lanjut — Jadwal Petugas dan Repository

## Implementasi

- Jadwal Petugas sekarang memuat daftar terkini melalui `GET /api/schedules` dan menyediakan tombol **Perbarui jadwal**. Data kosong tetap ditampilkan sebagai kosong, tanpa membuat jadwal fiktif.
- Jadwal Petugas dapat dihapus setelah konfirmasi melalui `DELETE /api/schedules/:id`. Jika API gagal, baris tidak dihapus dari tampilan dan pengguna mendapat pesan kesalahan.
- Sesudah penyimpanan jadwal, daftar dibaca ulang dari server agar nilai yang ditampilkan mengikuti hasil penyimpanan aktual.
- Repository memiliki tombol **Perbarui data** untuk memuat `GET /api/monitoring`, sambil mempertahankan pencarian, status filter, dan urutan tanggal aktif.
- Setelah menambah dokumen Repository, filter yang sedang aktif tidak direset secara diam-diam.
- Validasi tanggal Repository menggunakan pemeriksaan tanggal kalender, bukan hanya pola string.
- Ditambahkan 12 pemeriksaan regresi untuk perubahan ini.

## Batasan

- Uji statis/kontrak frontend bukan pengganti pengujian API dengan PostgreSQL aktif.
- Halaman Jadwal masih memiliki definisi legacy yang tidak dipakai; implementasi aktif adalah wrapper `pageJadwal = function`.
- Pencocokan Excel asli, seluruh hak akses akun, dan verifikasi data PostgreSQL live belum selesai.
- Persentase keseluruhan adalah estimasi, bukan hasil audit per persyaratan.
