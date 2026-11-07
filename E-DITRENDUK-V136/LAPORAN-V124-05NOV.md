# V124 — Pembenahan pengaman go-live (5 November 2026)

Dasar permintaan: REVISIAN27OKT26, disempurnakan oleh REVISI29OKT26. V124 meneruskan V123 tanpa menghapus revisi sebelumnya.

## Perubahan source
1. `backend/postgres-production-readiness.js` menolak URL contoh / localhost / HTTP, host database contoh dan password kosong atau placeholder, Storage URL dan service key palsu, serta nama bucket placeholder pada NODE_ENV=production. Diagnostik tidak mencetak kata sandi atau kunci.
2. `scripts/v124-production-config-test.js`: 16 kasus konfigurasi salah ditolak; file `.env.production.example` dipastikan tidak lolos sebagai konfigurasi nyata.
3. `npm run release-check` kini menggunakan `scripts/v124-release-check.js`: 15 kelompok pemeriksaan source read-only. Tidak menjalankan migrasi SQLite lama dan tidak mengubah data pegawai. Migrasi database hanya boleh dijalankan melalui proses terpisah dengan konfirmasi target dan backup.
4. Pengujian konfigurasi V117/V120/hosting yang dulu memakai host `example` diperbarui untuk memastikan fixture positif tetap valid di bawah pengamanan baru; skrip tes reverse proxy V119 kembali terekspos lewat `package.json`.

## Verifikasi
- `npm run release-check`: 15 kelompok pemeriksaan lulus, termasuk pemeriksaan revisi 27–29 Okt (14 butir) dan frontend (15 halaman).
- Pemeriksaan URL pada tes lokal, bukan server online.
- Tidak ada migrasi atau deploy ke proyek karyawan yang dijalankan di tahap ini.

## Progres dan batasan
Progres kesiapan source pada riwayat sebelumnya *diestimasi* 94%. Penambahan ini meningkatkan kesiapan konfigurasi dan release gate, tetapi tidak menyediakan dasar pengukuran persentase menyeluruh yang presisi. Jangan gunakan angka 100% sebagai status go-live.

## Syarat nyata sebelum URL karyawan dinyatakan siap
- Proyek PostgreSQL online + storage privat dengan kunci resmi dikelola di secret manager.
- Backup lalu `npm run postgres-apply` dengan konfirmasi nama database target.
- `npm run postgres-check`, tes login superadmin/pegawai, hak akses, upload lampiran, dan backup/restore.
- Deployment HTTPS, `npm run go-live-smoke -- https://alamat-resmi` dan uji pengguna nyata.
