# E-DITRENDUK V121 — pengujian penerimaan URL produksi (5 November 2026)

## Perubahan dari V120
- Tambah `scripts/v121-go-live-smoke.js`: pengujian read-only URL publik 8 endpoint yang memeriksa *isi respons*, bukan sekadar status 200.
- Pemeriksaan halaman login memastikan identitas E-DITRENDUK; `/api/health` dan `/api/ready` memastikan `ok: true` + `driver: postgresql`.
- `/api/auth/me` dan `/api/accounts` wajib menolak akses anonim dengan HTTP 401 dan JSON `ok:false`.
- `/.env`, `/server-postgres.js`, `/package.json` wajib tidak tersedia dari internet (404).
- HTTPS wajib pada URL eksternal; HTTP hanya diizinkan untuk localhost dalam pengujian otomatis.
- Tambah tes negatif untuk mendeteksi respons palsu: aplikasi lain, SQLite, DB tidak siap, akses anonim bocor, file rahasia bocor.
- Tambah uji HTTP terintegrasi untuk 8 endpoint terhadap server PostgreSQL-only lokal (`v121-go-live-http-test`).

## Perintah yang dapat dijalankan setelah hosting tersedia
`npm run go-live-smoke -- https://domain-resmi-instansi`

Tes tidak menggunakan akun/kredensial, tidak memodifikasi data, dan tidak memvalidasi proses login karyawan. Tes harus dijalankan **setelah** server dan PostgreSQL online, migrasi lengkap, Storage privat tersedia, data asli diimpor, dan login beberapa peran diverifikasi.

## Hasil lokal
- `node scripts/v121-go-live-smoke-test.js` PASS
- `node scripts/v121-go-live-http-test.js` PASS (8 HTTP endpoint dengan server nyata dan mock database)
- `npm run revisi-27-29-test` PASS (14 pemeriksaan)
- `npm run frontend-test` PASS (15 halaman)
- `node scripts/v120-runtime-entry-test.js` PASS

## Belum diverifikasi
URL HTTPS aktif, database dan Storage live, data asli, akun superadmin/pegawai, keamanan publik, serta backup/restore. Status angka 94% adalah estimasi kesiapan source sebelumnya, bukan persen go-live yang terukur. V121 tidak mengubah bukti go-live yang masih kosong.
