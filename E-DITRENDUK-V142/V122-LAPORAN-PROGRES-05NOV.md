# E-DITRENDUK V122 — 5 November 2026

## Basis revisi
REVISIAN27OKT26 adalah revisi dasar; REVISI29OKT26 merupakan koreksi/penyempurnaannya. Semua revisi tanggal 27 yang tidak diganti tanggal 29 tetap berlaku.

## Perubahan nyata V122
- Endpoint `/api/ready` sekarang melakukan **satu query read-only** yang memeriksa keberadaan 18 tabel **dan 35 kolom kritis** di PostgreSQL.
- Status HTTP 503 dikembalikan ketika tabel atau kolom kritis hilang, bukan memberi sinyal siap yang salah.
- Daftar kolom mencakup kredensial, sesi, profil, rate limit, payload modul, notulensi, audit dan registri file.
- `scripts/v122-schema-readiness-test.js` menguji kesesuaian source schema, query, dan respons HTTP saat kolom hilang.
- Output `missingTables` pada endpoint tetap dipertahankan untuk kompatibilitas; sekarang bisa memuat nama `tabel.kolom`.

## Bukti pengujian lokal
Lulus: `v122-schema-readiness-test`, `v117-production-readiness-test`, `v121-go-live-http-test`, `check`, `frontend-test` (15 halaman), `revisi-27-29-test` (14 pemeriksaan), `postgres-only-runtime-test`, `v116-shared-limiter-test`, `v118-login-abuse-http-test`, `v120-runtime-entry-test`, `v121-go-live-smoke-test`, `hosting-preflight-test`, `postgres-runtime-readiness-test`.

## Persentase progres
Estimasi kesiapan **source** sebelumnya 94%. V122 memperbaiki fail-closed database readiness, tetapi angka persentase total tidak bisa dihitung secara objektif tanpa kriteria berbobot dan pengujian produksi. Jangan samakan status source dengan situs aktif.

## Belum selesai (syarat 100%)
- Hosting HTTPS dan database PostgreSQL online belum tersedia/terhubung ke proyek ini.
- Penerapan migrasi asli, impor dan rekonsiliasi data asli, Storage privat, backup/restore diuji di server.
- Uji integrasi akun pegawai/superadmin, multi-pengguna, upload dokumen, dan browser nyata.
- Smoke test URL publik pada domain resmi; verifikasi hak akses dan keamanan go-live.

## Jalankan tes baru
`node scripts/v122-schema-readiness-test.js`

## Penting
Tidak ada data asli karyawan yang diubah. ZIP ini berisi source, bukan URL yang sudah di-deploy.
