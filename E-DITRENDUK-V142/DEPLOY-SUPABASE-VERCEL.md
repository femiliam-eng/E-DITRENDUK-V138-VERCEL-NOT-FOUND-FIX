# E-DITRENDUK: Supabase Free + Vercel Hobby (persiapan)

## Status
Adaptor Vercel `api/index.js` memakai **runtime PostgreSQL-only** dari `server-postgres.js`, bukan `server.js` (yang masih SQLite dan memang diblokir untuk produksi). **Belum live**, belum terhubung ke proyek Supabase, dan belum diuji end-to-end di Vercel. Jangan masukkan data pegawai asli sebelum pemeriksaan otorisasi dan backup.

## Supabase
1. Buat proyek Supabase Free, catat connection string PostgreSQL **pooler** yang sesuai untuk serverless, `Project URL`, dan service-role key. Jangan tempel secret ke chat atau repo.
2. Jalankan schema PostgreSQL dasar dan migrasi hingga **v117-profile-photos.sql** secara berurutan dan verifikasi tabel/izin dengan skrip di `scripts/` (baca dokumentasi `POSTGRES-CUTOVER-WORKLIST.json` dan hasil audit). Migrasi **belum dijalankan** di database pengguna.
3. Buat bucket **private** `notulen-private` dan `agenda-private`. Service-role key **hanya** di server Vercel.
4. Uji backup, role, akun, lampiran, dan semua API sebelum impor data asli.

## Vercel
1. Hubungkan repository privat ke Vercel, pilih direktori proyek sebagai Root Directory.
2. Gunakan framework preset `Other`; konfigurasi `vercel.json` mengarahkan request ke fungsi Node.js PostgreSQL-only.
3. Isi variabel dari `.env.production.example` pada **Project Settings**, bukan dari file `.env` dalam ZIP. `APP_ORIGIN` harus persis URL Vercel final.
4. Deploy ke Preview dahulu. Pastikan `/api/ready` = HTTP 200; status 503 beserta `missingTables` berarti migrasi belum lengkap. Tes `/api/health`, `/api/ready`, `/login.html`, `/fasilitasi.html`, login/logout, CRUD dan unggah lampiran dengan akun uji.
5. Tinjau batas Vercel Hobby dan Supabase Free. Jangan gunakan server.js di Vercel.

## Batasan penting
- `api/index.js` memakai pool cache per instance. Rate limit login/reset/notulensi memakai PostgreSQL shared limiter (V116). Jalankan migrasi V116 dan siapkan job pembersihan expiry; tetap uji perlindungan abuse dan concurrency pada staging.
- `includeFiles` harus diuji pada deployment nyata; jika asset 404, periksa output fungsi dan file tracing.
- PostgreSQL dan Storage belum tersedia di lingkungan ini. Semua tes di sini adalah tes statis/lokal, bukan tes deployment atau koneksi live.
- Untuk mengaktifkan akun Supabase dan Vercel, pemilik akun perlu menyetujui koneksi di ChatGPT atau melakukan setup di dashboard masing-masing.
