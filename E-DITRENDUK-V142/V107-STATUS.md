# V107 — Validasi notulen bersama

Perubahan nyata: jalur notulen SQLite kini menggunakan `validate()` dari `backend/postgres-notulen-handler.js`, yang sebelumnya hanya dipakai PostgreSQL. Ini menghilangkan duplikasi pemeriksaan MIME, magic bytes, tanggal, dan ukuran file. Pengujian kontrak lama disesuaikan untuk memeriksa modul validator yang sekarang menjadi sumber tunggal.

`npm run postgres-notulen-test`: PASS.
`npm run release-check`: PASS.

**BELUM POSTGRESQL-ONLY**: `server.js` masih membuka SQLite dan memiliki banyak query langsung. Jangan deploy ke staging/production. PostgreSQL/Supabase live belum diuji. Tidak ada URL publik.
