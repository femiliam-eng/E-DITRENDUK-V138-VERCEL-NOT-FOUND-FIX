# V123 — Migrasi PostgreSQL aman untuk persiapan go-live

**Dasar fungsional tetap REVISIAN27OKT26, disempurnakan REVISI29OKT26.** Perubahan ini hanya pada jalur instalasi database; belum membuktikan semua fitur secara online.

## Temuan
- Perintah migrasi lama menerapkan `postgres/schema.sql` (sejumlah `CREATE TABLE` tanpa `IF NOT EXISTS`). Menjalankannya kembali di database yang sudah berisi tabel dapat gagal.
- Password DATABASE_URL sebelumnya diteruskan sebagai argumen `psql` (dapat terlihat melalui inspeksi proses pada sebagian sistem).
- Instalasi awal dan upgrade membutuhkan langkah berbeda; tanpa transaksi, perubahan dapat terpasang sebagian.

## Perbaikan V123
- `npm run postgres-migrate-safe -- --plan` dapat dipakai tanpa database atau rahasia untuk meninjau migrasi.
- `npm run postgres-apply` dan `npm run postgres-migrate-safe -- --apply` sekarang memakai runner Node `pg`, tanpa password pada argumen proses.
- Runner memerlukan `DATABASE_URL` dan `CONFIRM_DATABASE_MIGRATION` yang **sama persis dengan nama database pada URL**. Konfirmasi baru dijalankan sesudah backup diuji.
- Runner memakai satu transaksi, `pg_advisory_xact_lock`, pembatasan waktu operasi, `ROLLBACK` pada error, serta validasi akhir **18 tabel dan 35 kolom**.
- Pada database kosong, runner memasang baseline. Pada database yang memiliki tabel inti, runner hanya memasang migrasi tambahan idempoten (termasuk fasilitasi V123) dan **tidak mengimpor atau menghapus data**.
- Skema parsial/tidak dikenal ditolak, bukan diperbaiki secara spekulatif.

## Langkah operator (staging dahulu)
1. Buat dan verifikasi backup PostgreSQL **serta Storage privat**. Simpan kredensial hanya di secret manager hosting.
2. Pastikan `DATABASE_URL` mengarah ke database **staging** yang telah dipilih.
3. Jalankan `npm run postgres-migrate-safe -- --plan` untuk memeriksa daftar migrasi.
4. Atur `CONFIRM_DATABASE_MIGRATION` ke nama database di URL; jalankan `npm run postgres-migrate-safe -- --apply`.
5. Jalankan `npm run postgres-runtime-readiness`, lalu smoke HTTP dan uji login dua peran beserta data asli. Tes mock lokal **tidak menggantikan** langkah ini.
6. Ulangi pada produksi hanya setelah staging lulus, backup bisa dipulihkan dan perubahan diotorisasi.

**Batasan:** transaksi DDL tidak memverifikasi integritas seluruh data historis, hak akses karyawan, keprivatan bucket Supabase, backup/restore, SSL, atau URL publik. V123 belum menerbitkan URL dan belum melakukan migrasi database live.
