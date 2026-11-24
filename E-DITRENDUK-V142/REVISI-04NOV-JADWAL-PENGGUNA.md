# Revisi Jadwal dan Pengguna (4 November 2026)

Acuan: REVISIAN27OKT26 (dasar) + REVISI29OKT26 (koreksi).

- Jadwal: urutan tanggal terbaru/terlama, pesan kosong, tidak memodifikasi urutan data sumber.
- Jadwal: edit hanya memperbarui UI setelah API berhasil; kegagalan tidak menampilkan perubahan palsu.
- Jadwal: mencegah klik simpan ganda, menyegarkan notifikasi/dashboard dan tab lain setelah sukses.
- Pengguna: menghapus metadata peran, hak akses, dan tahun aktivasi palsu pada renderer lama.
- Pengguna: perubahan unit/peran/akses/status/aktivasi mengirim sinyal sinkronisasi setelah API berhasil.

Belum dilakukan: pengujian database PostgreSQL hidup, import Excel, pengujian lintas pengguna.
