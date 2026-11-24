# V138 — Perbaikan Not found pada Vercel

## Masalah
V137 mengarahkan semua request melalui `api/index.js` menggunakan catch-all rewrite. Jika static HTML tidak dibundel ke Function, backend menjawab `Not found`. V138 memisahkan static dan API:

- `public/login.html`, `public/*.html`, `public/css/`, `public/js/`, `public/assets/` dan `public/partials/` = static Vercel.
- `/` = rewrite ke `/login.html`.
- `/api/:path*` = rewrite ke Function `/api/index`, tetap PostgreSQL/Supabase.
- `framework: null` = menggunakan Vercel Other / static + Functions, bukan server Node lama.
- Tidak ada SQL, tidak ada migrasi, tidak mengubah data atau akun Supabase.

## Cara publish ke proyek Vercel editrendukv137
1. Buka GitHub repo yang ditautkan ke Vercel `editrendukv137`. Pastikan root directory Vercel merujuk ke folder yang berisi `vercel.json` ini dan `api/index.js`.
2. **Update isi repo** dengan folder `public/` dan `vercel.json` V138 (jangan hanya upload ZIP sebagai satu file).
3. Commit ke branch `main`. Vercel memulai deployment baru.
4. Di Vercel Settings > Build and Deployment, pastikan Framework Preset `Other`; Root Directory sama dengan lokasi folder ini; Output Directory kosong/default; jangan set Build Command ke `npm start`.
5. Pastikan Environment Variables (DATABASE_URL, APP_ORIGIN, NODE_ENV dll.) tetap terpasang. Jika nama domain sekarang `editrendukv137.vercel.app`, `APP_ORIGIN` harus `https://editrendukv137.vercel.app` untuk autentikasi.
6. Buka `https://editrendukv137.vercel.app/login.html` kemudian domain root. Jika HTML tampil tapi API gagal, lihat Request Logs untuk `/api/...`; itu masalah berbeda.

## Keamanan
Jangan commit `.env`, credentials, atau `SUPABASE_SERVICE_ROLE_KEY`. Database dan user lama tidak perlu diubah.
