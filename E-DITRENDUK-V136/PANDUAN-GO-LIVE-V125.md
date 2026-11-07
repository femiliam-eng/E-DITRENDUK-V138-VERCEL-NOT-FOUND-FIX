# E-DITRENDUK V125 — Panduan menuju URL karyawan

**Status saat paket dibuat:** Tes source berjalan lokal. BELUM ada bukti aplikasi online atau login karyawan sudah lolos. Tidak ada akses ke akun hosting/DB milik instansi dalam paket ini.

## Langkah sebelum rilis (oleh pengelola hosting instansi)

1. Siapkan proyek PostgreSQL dan Supabase Storage dengan dua bucket **PRIVATE**: `notulen-private` dan `agenda-private` (atau nama sesuai environment).
2. Simpan rahasia hanya di secret manager hosting, bukan ZIP/Git. Salin nama variabel dari `.env.production.example`, **ganti seluruh nilai contoh**. Pastikan APP_ORIGIN adalah URL HTTPS instansi.
3. Ambil backup lengkap database lama terlebih dahulu, termasuk file lampiran dan daftar akun, kemudian verifikasi backup dapat dipulihkan di staging.
4. Uji kesiapan source: `npm ci` kemudian `npm run release-check`.
5. Uji dependensi nyata dengan environment production yang sudah diatur: `npm run live-dependencies`. Pemeriksaan ini read-only dan harus meluluskan PostgreSQL serta *kedua* bucket PRIVATE. **Tidak membuktikan transfer file atau login.**
6. Jika database belum dimigrasi, jalankan `npm run postgres-migrate-safe` untuk melihat rencana. Setelah backup dan nama database target dikonfirmasi, baru gunakan `CONFIRM_DATABASE_MIGRATION=<nama_database> npm run postgres-apply` dari lingkungan aman. Jangan jalankan migrasi otomatis dari CI biasa.
7. Impor data sumber **hanya setelah** verifikasi pemetaan dan backup; bandingkan jumlah entitas dan contoh record dari beranda, repository, Monitoring, RAKOM, Agenda, dan Jenis Fasilitasi.
8. Deploy backend PostgreSQL-only melalui hosting HTTPS yang disetujui instansi. Tes URL: `npm run go-live-smoke -- https://alamat-instansi.go.id`.
9. Tes manual dengan akun superadmin dan dua pegawai dari unit berbeda: login/logout, hak akses, perubahan unit, foto profil, pembaruan sandi, Monitoring, RAKOM, Agenda, Task Deadline, Logbook, Jenis Fasilitasi, upload/download dokumen, notifikasi, reminder, filter, pengurutan tanggal, dan akses tidak sah.
10. Pastikan audit log, backup berkala, pemulihan backup di staging, HTTPS, penanganan insiden, dan pemilik operasional sudah ada sebelum URL dibagikan ke karyawan.

## Pemeriksaan V125

- `npm run release-check`: 16 kelompok tes source, read-only.
- `npm run live-dependencies`: secara online memverifikasi konfigurasi, skema PostgreSQL (18 tabel dan 35 kolom), keberadaan dan sifat PRIVATE dari dua bucket Supabase; tidak mengubah isi DB/Storage. Memerlukan jaringan, hak akses, dan environment produksi sah.
- `npm run go-live-smoke -- https://...`: pemeriksaan URL tanpa login. **Bukan** pengganti tes autentikasi nyata.

**Jangan pernah kirim** `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, atau cookie sesi melalui chat. Atur langsung pada hosting secret manager.
