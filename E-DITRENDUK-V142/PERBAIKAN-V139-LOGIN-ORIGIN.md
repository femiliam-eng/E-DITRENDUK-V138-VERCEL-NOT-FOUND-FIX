# E-DITRENDUK V139 — Fix login "Origin tidak diizinkan"

**Perubahan sangat terbatas:** hanya `backend/request-security.js` dan pemanggilan `originAllowed` pada `server-postgres.js`.

Kode sebelumnya hanya menerima `APP_ORIGIN`, sehingga login ditolak ketika pengguna membuka domain produksi Vercel yang lain. V139 menambah pemeriksaan alamat resmi yang diberikan **oleh environment Vercel**: `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`, `VERCEL_BRANCH_URL`. Jika domain browser cocok salah satunya, login diperbolehkan. Origin asing atau permintaan cross-site tetap ditolak; kode tidak menggunakan Host/X-Forwarded-Host sebagai sumber kepercayaan.

**Tidak ada perubahan Supabase, akun, password, migrasi, atau data.** Jangan mengunggah `.env`, mereset akun, atau mengimpor ulang workbook.

## Cara memasang ke proyek yang SUDAH ada

1. Unduh dan ekstrak V139.
2. Pada repository GitHub yang dipakai proyek Vercel sekarang, salin/replace **dua file berikut** dari paket: `backend/request-security.js` dan `server-postgres.js` pada *root directory* yang sama (mis. folder `E-DITRENDUK-V136`).
3. Commit ke branch `main`. Tunggu Vercel membuat deployment production terbaru. Jangan buat proyek Vercel atau Supabase baru.
4. Pastikan `APP_ORIGIN` tetap URL HTTPS project milikmu tanpa `/login.html`, mis. `https://editrendukv136.vercel.app`. Tetap rahasiakan `DATABASE_URL` dan service-role key.
5. Tes login dari URL produksi yang benar menggunakan akun milikmu. Jangan kirim password ke chat, dan rotasi password yang pernah muncul di screenshot.

Jika setelah dua file di-commit muncul pesan selain `Origin tidak diizinkan`, catat pesan terbaru; ini bisa berarti koneksi database atau autentikasi butuh perbaikan terpisah.

Test V139: `node scripts/v139-vercel-origin-test.js`, `node scripts/request-security-test.js`, `node scripts/v78-security-ops-test.js`.
