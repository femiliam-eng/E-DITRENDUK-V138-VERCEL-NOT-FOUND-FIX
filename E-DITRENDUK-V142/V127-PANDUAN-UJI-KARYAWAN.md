# V127 — Uji login Superadmin dan Pegawai pada URL sebenarnya

## Yang sudah bisa dilakukan tanpa infrastruktur online

- `npm run release-check` menguji source tanpa mengakses database produksi atau mengubah data.
- `npm run v127-employee-login-smoke-test` mensimulasikan login, pemeriksaan sesi, pembatasan hak akses, dan logout untuk dua jenis akun. Simulasi **bukan** bukti akun live.

## Setelah domain HTTPS dan PostgreSQL/Storage sudah tersedia

1. Siapkan dua **akun uji khusus** yang aktif: satu `Superadmin`, satu `Pegawai`. Gunakan akun non-produksi/staging apabila memungkinkan. Jangan mengirimkan password di chat, source, ZIP, atau screenshot.
2. Atur secrets lewat environment hosting atau terminal lokal yang dipercaya: `DATABASE_URL`, `APP_ORIGIN`, variabel Supabase privat, serta `SMOKE_ADMIN_USERNAME`, `SMOKE_ADMIN_PASSWORD`, `SMOKE_EMPLOYEE_USERNAME`, `SMOKE_EMPLOYEE_PASSWORD`.
3. Jalankan `npm run employee-acceptance-live`. Skrip memeriksa gate infrastruktur V126, lalu **login dua peran**, cek sesi `/api/auth/me`, memastikan hanya Superadmin boleh membaca `/api/accounts`, dan logout.
4. Skrip mengembalikan status gagal jika salah satu akun tidak bisa masuk, akses pegawai tidak ditolak, atau logout bermasalah. Log tidak menampilkan username, password, token cookie, ataupun isi daftar akun.
5. Lanjutkan uji manual dokumen Repository, lampiran, Jenis Fasilitasi, data awal, notifikasi, backup/restore di lingkungan yang disetujui instansi.

## Batasan

Skrip live **tidak** otomatis membuat akun atau database, **tidak** melakukan deployment, **tidak** mengubah data bisnis. Login akan membuat sesi uji yang langsung dicabut saat logout. Jangan menjalankannya pada akun pribadi karyawan tanpa persetujuan. Jika URL/akun belum ada, gate akan gagal sebagaimana mestinya; itu bukan kerusakan ZIP.
