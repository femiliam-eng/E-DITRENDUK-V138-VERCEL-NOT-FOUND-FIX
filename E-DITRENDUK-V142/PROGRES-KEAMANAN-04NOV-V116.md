# Progres V116 — shared PostgreSQL rate limiting

- Login, permintaan reset password dan unggahan notulensi menggunakan counter PostgreSQL atomik, tidak lagi counter per instance.
- Tambah migration `postgres/migrations/v116-shared-rate-limit.sql`; **wajib diaplikasikan sebelum deployment**. Pastikan akses tulis tabel untuk user DB aplikasi.
- Counter berbentuk jendela tetap. Login dibatasi 8 permintaan/15 menit per kombinasi alamat IP dan username, reset 1/menit per alamat IP, notulensi 12/15 menit per akun.
- Fail closed jika query limiter PostgreSQL gagal. Jangan jalankan tanpa migrasi.
- Cleanup berkala diperlukan: `DELETE FROM ed_request_limits WHERE expires_at < now() - interval '1 day';` pada scheduler DB.
- Pengujian lokal tidak menggantikan pengujian concurrency/rate limit lintas instance dengan PostgreSQL live.
- Kebutuhan untuk URL karyawan: hosting, database Supabase, private bucket, migrasi semua data, audit izin, E2E login/upload, pengamanan domain, backup dan penerimaan pengguna belum selesai.

- Endpoint `/api/ready` dan boot PostgreSQL memeriksa tabel pembatas. Database yang belum dimigrasi tidak akan dianggap siap.
