# Revisi 4 November — Pengguna dan integritas pembaruan

## Perubahan kode
- Unit kerja pengguna kini dapat diubah langsung dari tabel Pengguna, divalidasi tidak kosong, disimpan melalui API, dan di-rollback apabila server menolak.
- Tombol **Perbarui pengguna** membaca daftar pengguna terbaru dari API. Data baru dipasang hanya setelah respons berbentuk array valid.
- Penghitung pengguna aktif dan admin diperbarui setelah status atau peran tersimpan.
- Handler tombol reset kata sandi tidak lagi bertumpuk saat daftar pengguna dirender ulang.
- Perubahan unit memicu sinyal sinkronisasi dashboard dan tab browser lain.

## Batasan yang belum boleh dinyatakan selesai
- Belum diuji dengan koneksi PostgreSQL aktif atau dua akun sungguhan.
- Belum diuji apakah perubahan unit diri sendiri tercermin pada semua widget Beranda dalam sesi yang sama.
- Belum dilakukan rekonsiliasi seluruh baris workbook Excel dengan sumber database.
- Aplikasi belum dideploy.

## Perintah verifikasi
`npm run check`, `npm run frontend-test`, `npm run revisi-27-29-test`, `node scripts/nov4-user-management-release-regression.js`.

Persentase progres sebelumnya (97%) adalah perkiraan, bukan metrik audit. Tidak ada dasar untuk menyatakan 100% sebelum pengujian integrasi akhir.
