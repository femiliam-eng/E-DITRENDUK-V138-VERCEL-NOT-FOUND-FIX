# E-DITRENDUK V127 — bukti pengerjaan

Dasar revisi: REVISIAN27OKT26, dengan REVISI29OKT26 sebagai koreksi/penyempurnaan.

## Penambahan yang nyata
- `scripts/v127-employee-login-smoke.js`: pengujian login real dua peran (Superadmin dan Pegawai), sesi `/api/auth/me`, otorisasi `/api/accounts` (200/403), logout, timeout dan tidak menampilkan rahasia.
- `scripts/v127-employee-acceptance.js`: menggabungkan gate infrastruktur+akun V126 dan autentikasi nyata V127; keduanya wajib lulus.
- Tes V127 negatif: Pegawai salah diberi akses, peran admin salah, logout gagal, login pegawai gagal, konfigurasi kosong/tidak HTTPS, dan pemeriksaan agar password/cookie tidak tercetak.
- Perintah npm: `employee-auth-live-smoke`, `employee-acceptance-live`, `v127-employee-login-smoke-test`.
- `release-check` kini mencakup tes V127.

## Bukti tes lokal
- `npm run check`: lulus.
- `npm run revisi-27-29-test`: 14/14 lulus.
- `npm run frontend-test`: 15 halaman lulus.
- `npm run v127-employee-login-smoke-test`: lulus.
- `npm run release-check`: 18/18 kelompok lulus.

## Yang belum selesai
Belum ada bukti URL HTTPS organisasi, koneksi PostgreSQL/Supabase yang aktif, pengguna asli, migrasi data sumber, backup/restore, dan uji penerimaan pengguna nyata. Simulasi V127 tidak sama dengan tes di domain produksi. Tidak ada klaim aplikasi live atau 100% selesai.
