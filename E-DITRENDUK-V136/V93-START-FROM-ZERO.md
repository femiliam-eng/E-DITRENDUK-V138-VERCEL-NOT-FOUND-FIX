# V93 — Persiapan dari nol menuju URL E-DITRENDUK

**Status: BELUM LIVE, BELUM PRODUCTION READY.** V93 menyediakan gerbang konfigurasi yang *fail closed*, bukan migrasi PostgreSQL selesai atau deployment otomatis.

## Rekomendasi arsitektur
- Database: proyek Supabase PostgreSQL terpisah untuk **staging** dan **production** (jangan gunakan data asli di staging).
- File: bucket privat Supabase Storage; uji otorisasi, konflik unggahan, backup dan restore.
- Hosting backend: layanan Node.js yang mendukung disk persisten bila masih ada file lokal, TLS, secret env, health check, dan backup; pilih setelah migrasi runtime selesai. Alternatif: VPS Docker + reverse proxy HTTPS yang dikelola operator.
- Domain: subdomain resmi instansi bila mendapat persetujuan; jangan mengasumsikan `go.id` tersedia tanpa otorisasi.

## Urutan pelaksanaan
1. Buat akun penyedia hosting dan Supabase atas nama pemilik/instansi, aktifkan MFA dan pengelola cadangan.
2. Buat dua proyek Supabase, aktifkan kebijakan akses minimum, siapkan bucket privat dan backup.
3. Simpan `DATABASE_URL`, secret sesi dan storage key hanya di pengelola secrets backend, bukan di frontend, Git, ZIP publik, atau chat.
4. **Selesaikan migrasi SQLite -> PostgreSQL di seluruh server.js**, lalu perbaiki compose yang masih `DB_DRIVER: sqlite`; jangan mengganti label driver saja.
5. Jalankan `npm run release-check`, `npm run production-readiness-gate`, tes database nyata dan dua instance, lalu tes restore data staging.
6. Deploy staging; pasang `APP_ORIGIN` HTTPS yang tepat, jalankan `PUBLIC_URL=https://... npm run v92-public-url-check` dan `npm run public-security-smoke`.
7. Minta persetujuan keamanan, kepemilikan data, kebijakan retensi, DNS, sertifikat TLS, monitoring, backup dan rollback sebelum produksi.

## Gerbang V93
`npm run v93-deployment-plan-check` mengembalikan exit code 1 bila prasyarat belum dipenuhi. Ini pemeriksaan statis/konfigurasi, **bukan bukti** database atau URL sungguhan sudah berjalan. Tidak pernah mencetak nilai secret.

## Yang dibutuhkan dari pemilik proyek
Persetujuan membuat akun hosting dan Supabase, keputusan pemilik domain/subdomain, dan operator yang dapat mengatur DNS. Jangan mengirim password, token, atau connection string ke chat.
