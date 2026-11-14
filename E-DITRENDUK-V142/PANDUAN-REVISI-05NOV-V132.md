# E-DITRENDUK V132 — Revisi 5 November dan paket data Supabase

## Sudah diterapkan di source

1. **Jenis Fasilitasi** kini memakai `css/style.css`, topbar, sidebar, halaman workspace, tipografi, kartu, dan form sesuai gaya Beranda/Agenda.
2. **Profil & Akses** menampilkan nama, username, unit, email, peran, foto, pilihan ubah kata sandi, dan 30 aktivitas terakhir milik akun yang login. Nama profil dapat diedit oleh pengguna yang memiliki sesi valid; perubahan dilakukan pada tabel `accounts` dan dicatat di `audit_logs`. Riwayat akun lain tidak dapat dibaca melalui endpoint Pegawai.
3. **Persiapan data Supabase/PostgreSQL** membaca 2 file Excel pengguna, mengarsipkan 7.089 baris sumber dari 35 sheet ke JSON Lines terkompresi, serta membuat pemetaan 422 Agenda Kegiatan dan 53 Task Deadline ke payload yang digunakan aplikasi.

## Penting: data BELUM diunggah ke Supabase

Proyek Supabase belum ditemukan dalam akun yang terhubung. Koneksi Supabase harus dibuat dan diketahui terlebih dahulu sebelum impor. Paket data berada di folder `data-import`, tidak terbuka sebagai endpoint publik. Jangan mengunggahnya ke repositori publik.

Data tersimpan sebagai **baris sumber lengkap** dengan informasi sheet, nomor baris, workbook, dan hash sumber sehingga semua tab (termasuk Log Book 2026) tersimpan tanpa perubahan asumsi kolom. Yang **langsung dapat ditampilkan sebagai modul** saat publish hanyalah Agenda dan Task, dari workbook Agenda. Data dari 32 sheet Log Book lain masih di tabel staging untuk dicocokkan dan dipetakan sesuai modul dan validasi instansi; tidak boleh diklaim sudah tampil di Monitoring/Logbook/RAKOM.

## Cara impor ketika database Supabase tersedia

1. Backup database target, pastikan migrasi E-DITRENDUK V131/V132 terpasang.
2. Sambungkan `DATABASE_URL` PostgreSQL Supabase memakai kredensial di terminal privat, **jangan diunggah ke chat atau Git**.
3. `npm run excel-supabase-dry-run` — hanya memeriksa target dan jumlah sumber.
4. Jika target sudah diverifikasi, set `$env:CONFIRM_EXCEL_IMPORT="YES"` pada terminal PowerShell, lalu:
   - `npm run excel-supabase-import` — memasukkan seluruh baris sumber ke tabel `ed_source_excel_rows` **tanpa** mempublikasikan ke modul.
   - `npm run excel-supabase-publish` — juga memasukkan 422 Agenda dan 53 Task ke tabel aplikasi (konflik ID dilewati, bukan ditimpa).
5. `Remove-Item Env:CONFIRM_EXCEL_IMPORT` dan `npm run postgres-check`.

Impor memakai transaksi PostgreSQL, advisory lock, pemeriksaan jumlah sumber, serta `ON CONFLICT DO NOTHING`. Tidak ada `DELETE`, `TRUNCATE`, atau reset. Berkas sumber Excel tidak diubah.

**Akun login:** database lokal baru yang belum diimpor dari SQLite tetap memerlukan pemulihan 22 akun melalui `npm run recover-local-accounts` dari V131. Upload Excel tidak membuat akun atau memulihkan password.

**Perhatikan keamanan:** ganti password PostgreSQL yang pernah tertulis pada log yang dibagikan sebelumnya.
