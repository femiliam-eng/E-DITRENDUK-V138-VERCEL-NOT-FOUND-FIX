# Perbaikan Jenis Fasilitasi — 4 November

Akar masalah `Not found`: `fasilitasi.html` ada, tetapi tidak termasuk daftar halaman publik di `backend/static-file-policy.js`. Sekarang halaman diizinkan tanpa membuka file privat.

Perbaikan kedua: jalur `/api/fasilitasi` sudah terdaftar pada `postgres-unified-handler.js`, tetapi `server.js` tidak meneruskan request ke handler tersebut. Dispatcher sekarang mengizinkan `/api/fasilitasi` ketika `PG_PRIMARY_AUTH=1` dan `PG_PRIMARY_PAYLOAD=1`.

Catatan penting: unggah bukti pada `/api/fasilitasi/:id/attachments` belum diimplementasikan oleh handler saat ini. Jangan menganggap upload sudah berfungsi. PostgreSQL aktif pengguna belum diuji. UI tidak lagi mengklaim data selalu tersimpan ke PostgreSQL.

Pemeriksaan: `npm run check`, `npm run frontend-test`, pemeriksaan allowlist halaman, dan dispatch API lulus.
