# Progres V118 — Perlindungan akses multi-karyawan

Basis: REVISIAN27OKT26 disempurnakan REVISI29OKT26; dilanjutkan dari V117.

## Perubahan aktual
- Login diberi dua batas percobaan independen berbasis counter PostgreSQL bersama: 30 percobaan/15 menit per IP server-observed, dan 8 percobaan/15 menit per identitas akun (case-insensitive). Semua percobaan menghitung kedua counter; percobaan yang diblok tidak membaca akun.
- Unggah foto profil dibatasi menjadi 12 permintaan/15 menit per akun, dengan counter PostgreSQL bersama.
- Tes regresi V116 disesuaikan dan tes HTTP V118 ditambahkan untuk mencegah bypass dengan rotasi username.

## Status produksi
- Belum ada PostgreSQL/Supabase/Vercel aktif pada lingkungan yang diperiksa, migrasi dan data asli belum ditest live, URL karyawan belum ada.
- Persentase kesiapan kode adalah estimasi, bukan persentase validasi produksi.
- IP yang terlihat di Vercel/serverless dapat berupa proxy; untuk pembatas IP yang tepat perlu skema trusted-proxy dan pengujian infrastruktur sebelum produksi.
