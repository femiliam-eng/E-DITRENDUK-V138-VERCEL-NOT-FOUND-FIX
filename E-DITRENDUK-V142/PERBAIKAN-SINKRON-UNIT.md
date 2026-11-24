# Perbaikan lanjutan PostgreSQL

- Navigasi Jenis Fasilitasi kini tersedia di sidebar dan pencarian global. Izin mengikuti modul Agenda sesuai handler backend.
- Identitas pengguna diambil ulang dari `/api/auth/me` (PostgreSQL) setiap 30 detik ketika tab aktif dan saat tab kembali aktif. Perubahan unit kerja dan nama tampil di beranda tanpa logout.
- Perubahan role/permissions memicu reload navigasi; otorisasi API tetap ditegakkan server.
- Tidak ada perubahan skema dan tidak perlu impor SQLite ulang.

Belum diklaim selesai: foto profil, notifikasi lintas pengguna penuh, dan uji E2E pada PostgreSQL Windows pengguna.
