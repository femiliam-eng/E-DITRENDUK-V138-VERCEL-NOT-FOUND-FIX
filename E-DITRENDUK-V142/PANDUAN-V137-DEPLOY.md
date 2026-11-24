# V137 — Memperbaiki Vercel FUNCTION_INVOCATION_FAILED (SQLite gate)

**Tidak ada perubahan skema atau data Supabase**. Perbaikan ini hanya menjamin bahwa entrypoint default `server.js` memanggil PostgreSQL-only `api/index.js`, dan memperbaiki konfigurasi `includeFiles`.

Jika mengunggah ZIP lengkap ke GitHub, pastikan file masuk ke subfolder `E-DITRENDUK-V136` yang memang dipilih sebagai Root Directory di Vercel, *bukan* ke folder induk lain.

Setelah commit, Vercel otomatis redeploy. Di halaman **Deployments**, periksa hash commit terbaru, **bukan** hanya status Ready.

## Konfigurasi Environment Variables Vercel, tanpa memaparkan password

Tambahkan di Project Settings → Environment Variables:

- `NODE_ENV=production`
- `DATABASE_URL` → PostgreSQL URI Supabase Session Pooler
- `APP_ORIGIN=https://editrendukv136.vercel.app`
- `NOTULEN_STORAGE_PROVIDER=supabase`
- `SUPABASE_URL=https://hgefzuctqokmlaruugjh.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` → server-only secret dari Supabase, simpan sebagai Sensitive, **jangan commit/paste di chat**
- `SUPABASE_STORAGE_BUCKET=notulen-private`
- `AGENDA_STORAGE_BUCKET=agenda-private`

Jangan membuat bucket sembarangan jika belum ada; cek dan pastikan privat. Simpan env lalu Redeploy agar variabel berlaku pada versi baru.

Pastikan aplikasi benar-benar masuk halaman login dan `/api/auth/me` mengembalikan status yang benar untuk sesi yang belum login (bukan error 500). Gunakan Request Logs untuk melihat error runtime jika masih gagal. Jangan menghapus `ed_source_excel_rows` atau data akun.

## Verifikasi lokal

`npm install`
`npm run check`
`npm start` (pastikan environment database sudah diatur di PowerShell atau `.env` dimuat dengan Node `--env-file`)

GitHub root-`server.js` yang baru harus memuat `const handle = require('./api/index.js')` agar Vercel tidak menjalankan SQLite.
