# Perubahan terukur — 3 November 2026

Dasar: source revisi 31 Oktober, revisi 27 Oktober sebagai dasar, koreksi 29 Oktober mengesampingkan butir yang bertentangan.

## Diterapkan
- Status baca notifikasi disimpan per akun di localStorage agar tetap terbaca setelah reload dan sinkron antartab.
- Pengingat dengan data ID/tanggal tidak valid tidak ditampilkan.
- Tanggal pengingat yang tidak valid tidak memunculkan Invalid Date.
- Kegagalan HTTP pengingat tidak lagi diam-diam dianggap daftar kosong.
- Ketika pengingat gagal dimuat, tampil pesan koneksi pada panel.
- Panduan ditambah langkah Jenis Fasilitasi, unggah bukti dukung, Task Deadline, dan notifikasi.
- Kesalahan penyimpanan status baca tidak mematikan antarmuka.

## Belum diverifikasi
- Belum dilakukan uji browser multiakun, PostgreSQL live, dan audit lengkap semua poin revisi.
- Jangan menganggap paket ini sebagai final keseluruhan.
