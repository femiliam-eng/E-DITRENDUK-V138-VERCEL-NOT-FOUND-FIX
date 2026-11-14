# E-DITRENDUK V120 — penyatuan runtime PostgreSQL-only

## Yang diubah
- `npm start`, `npm run dev`, `package.json` main dan pemeriksaan sintaks memakai `server-postgres.js`, bukan server SQLite lama.
- `scripts/hosting-preflight.js` memakai validasi konfigurasi produksi yang sama dengan runtime PostgreSQL, sehingga tidak lagi mensyaratkan flag `PG_PRIMARY_*` lama ataupun `SESSION_SECRET` yang tidak dipakai runtime PostgreSQL-only.
- Ditambahkan `scripts/v120-runtime-entry-test.js` untuk mengunci Docker, Vercel, npm start/dev, dan pemeriksaan preflight terhadap regresi.
- Unit test konfigurasi hosting disesuaikan ke storage bucket yang benar.

## Pengujian yang dijalankan
- `node scripts/v120-runtime-entry-test.js`
- `node scripts/hosting-preflight-test.js`
- `npm run revisi-27-29-test`
- `npm run frontend-test`
- `node scripts/v117-production-readiness-test.js`
- `node scripts/v118-login-abuse-http-test.js`
- `node scripts/v119-trusted-proxy-http-test.js`
- `node scripts/postgres-only-runtime-test.js`
- `node scripts/production-runtime-gate-test.js`
- `node scripts/deploy-config-check.js .env.production.example`

## Belum terverifikasi
Tidak ada deployment URL aktif, koneksi PostgreSQL/Supabase online, migrasi data asli, backup-restore sungguhan, dan uji bersama karyawan dalam sesi ini. Lulus unit test tidak berarti siap produksi. **Angka progres 94% sebelumnya bersifat estimasi source, bukan metrik audit formal.**
