# E-DITRENDUK — kelanjutan menuju URL karyawan (4 November 2026)

## Selesai pada paket ini
- Dockerfile kini menjalankan `server-postgres.js` bukan `server.js` (SQLite lama).
- `compose.yaml` mengharuskan `DATABASE_URL`, `APP_ORIGIN`, URL Supabase dan service-role key, bukan berpura-pura SQLite siap produksi.
- Supabase private storage dipakai untuk notulensi dan lampiran; tidak menyimpan berkas pegawai di disk container sementara.
- Startup PostgreSQL-only menolak konfigurasi produksi tanpa Storage privat dan HTTPS origin.
- Tes deployment kit disesuaikan ke arsitektur saat ini; tes keamanan startup ditambahkan.

## Belum boleh disebut live
- Belum ada proyek Vercel maupun Supabase yang muncul dari koneksi akun pada pemeriksaan ini.
- Migrasi PostgreSQL di database nyata, bucket privat, impor dan rekonsiliasi data, akun pegawai, backup/restore dan end-to-end dari URL publik belum diuji.
- Jalur Docker memerlukan reverse proxy HTTPS; `APP_ORIGIN` harus domain publik HTTPS resmi.
- Rate limit pada runtime PostgreSQL masih berbasis memori per-instance. Audit dan mitigasi sebelum dibuka ke internet.

## Checklist menuju 100% go-live
1. Sediakan proyek Supabase dan proyek Vercel / hosting yang sudah disetujui organisasi.
2. Migrasikan skema dan data ke PostgreSQL nyata; verifikasi konsistensi serta izin.
3. Buat bucket Supabase privat `notulen-private` dan `agenda-private`.
4. Isi secret langsung di dashboard hosting (jangan menaruh secret di ZIP atau chat).
5. Deploy preview, periksa `/api/ready` dan seluruh login, role, CRUD, dokumen dan unggahan.
6. Audit keamanan, logging, rate limiting multi-instance, backup/restore, dan uji pengguna.
7. Tetapkan HTTPS/domain resmi lalu lakukan acceptance test dari perangkat karyawan.

Jalankan pemeriksaan lokal:
`npm run check && npm run revisi-27-29-test && node scripts/production-deployment-safety-test.js`
