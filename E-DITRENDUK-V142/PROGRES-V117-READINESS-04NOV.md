# E-DITRENDUK V117 — Pengamanan kesiapan deployment

## Yang diperbaiki (berdasarkan source ZIP V116)
1. Endpoint `/api/ready` kini memeriksa keberadaan 18 tabel PostgreSQL operasional, bukan hanya `ed_request_limits`; HTTP 503 jika tabel hilang atau DB bermasalah.
2. Pemeriksaan saat startup Docker/Node turut memblokir server bila tabel wajib belum tersedia.
3. Ditemukan ketidaksesuaian nyata: endpoint `/api/profile/photo` memakai `ed_profile_photos`, tetapi tabel tersebut tidak ada di `postgres/schema.sql` V116. Ditambah skema tabel serta migrasi idempotent `postgres/migrations/v117-profile-photos.sql`.
4. Konfigurasi Node dan Vercel menggunakan validasi environment produksi bersama; HTTPS dan PostgreSQL online serta dua bucket privat wajib ada.
5. Skrip `deploy-config-check.js` sebelumnya salah mengharuskan SQLite V18. Sekarang memvalidasi PostgreSQL-only dan menolak konfigurasi SQLite.
6. Pengujian deployment V100 sebelumnya bergantung pada template staging yang hilang dan pemeriksaan legacy SQLite. Diganti dengan pengujian yang sesuai runtime terbaru dan disertakan template contoh tanpa credential asli.
7. Ditambah `scripts/v117-production-readiness-test.js` untuk menguji kondisi siap, migrasi hilang, serta kegagalan konfigurasi.

## Verifikasi / batasan
- Pengujian memakai mock pool PostgreSQL, bukan DB sungguhan; status produksi belum terbukti.
- **Jangan deploy publik sebelum** migrasi V117 diterapkan pada database nyata, koneksi Supabase Storage privat aktif, tes login/sesi/unggah akun karyawan, backup/restore dan otorisasi lulus, serta HTTPS URL disediakan.
- Pastikan bucket `notulen-private` dan `agenda-private` bersifat **private**. Jangan simpan service-role key dalam ZIP/git/frontend.
- ZIP ini tidak mengandung database karyawan asli atau URL produksi yang sudah aktif.

## Perintah pengujian
```
node scripts/v117-production-readiness-test.js
npm run postgres-only-runtime-test
npm run revisi-27-29-test
npm run frontend-test
npm run v100-deployment-hardening-test
npm run verify-release
```
