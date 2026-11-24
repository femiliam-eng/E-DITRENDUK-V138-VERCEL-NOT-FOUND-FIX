# E-DITRENDUK V129 — Login pertama dan pengamanan password sementara

Tanggal: 5 November 2026

## Dasar revisi
REVISIAN27OKT26 menjadi daftar kebutuhan awal; REVISI29OKT26 adalah koreksi/penyempurnaan, bukan pengganti seluruh daftar tanggal 27.

## Perbaikan dilakukan
1. Backend PostgreSQL menolak semua API layanan (HTTP 403, `PASSWORD_CHANGE_REQUIRED`) jika akun masih menggunakan password sementara. Pengecualian hanya untuk melihat identitas sendiri, mengubah password, dan logout.
2. Frontend membuka modal ubah password **sebelum** meminta data workspace. Sesudah berhasil ganti password, halaman dimuat ulang untuk melanjutkan sesi.
3. Backend mengirim kedua bentuk penanda `must_change_password` dan `mustChangePassword` agar kompatibel dengan frontend.
4. Ditambah `v129-first-login-enforcement-test` menggunakan server HTTP nyata dengan pool PostgreSQL simulasi: autentikasi akun sementara, API diblokir, ganti password, API terbuka kembali, dan akun permanen tetap berfungsi.
5. Tes V129 dimasukkan ke `npm run release-check` (20 kelompok tes).

## Bukti pengujian lokal
- `node scripts/v129-first-login-enforcement-test.js`: PASS
- `npm run release-check`: 20/20 kelompok lulus.
- Pengujian ini tidak memakai akun, database, ataupun URL produksi yang asli.

## Syarat go-live yang masih terbuka
1. Sediakan URL HTTPS hosting resmi dan konfigurasi PostgreSQL online serta dua bucket Supabase privat.
2. Terapkan migrasi ke database kosong atau lama via `npm run postgres-migrate-safe` sesuai panduan V123 (jangan menjalankan migrasi sembarangan di DB berisi data).
3. Jika database accounts masih kosong, buat Superadmin pertama dengan panduan V128 melalui secret manager, kemudian ubah password saat login pertama.
4. Siapkan minimal satu akun Pegawai aktif; uji role lewat `npm run employee-acceptance-live` dengan kredensial uji dalam secret manager.
5. Uji upload/buka dokumen, kelengkapan data asli, backup dan restore, serta persetujuan organisasi sebelum URL disebarkan.

**Status:** pembenahan source dan tes lokal selesai, **belum** ada verifikasi URL produksi atau pemakaian karyawan nyata. Angka 100% untuk sistem live tidak boleh diklaim.
