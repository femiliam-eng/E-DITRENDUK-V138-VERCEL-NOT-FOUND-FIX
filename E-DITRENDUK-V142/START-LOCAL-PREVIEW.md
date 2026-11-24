# E-DITRENDUK — preview lokal (bukan produksi)

## Menjalankan sekarang
Butuh Node.js >=22.5.

```bash
NODE_ENV=development PORT=3000 node server.js
```
Buka `http://localhost:3000/landing.html` pada komputer yang menjalankan server.

## Hasil pengujian
Pada 2026-10-26, server development dijalankan di port 38765 dan GET `/landing.html` mengembalikan HTTP 200. Ini **tidak** memverifikasi login, database PostgreSQL, keamanan deployment, atau semua fitur.

## Jangan publikasikan mode development
Backend masih menginisialisasi SQLite dan `backend/production-runtime-gate.js` memblokir production/staging. Jangan membuka port development ke internet atau menonaktifkan gate. URL publik memerlukan migrasi kode, database nyata, pengujian integrasi, serta akun hosting/domain.
