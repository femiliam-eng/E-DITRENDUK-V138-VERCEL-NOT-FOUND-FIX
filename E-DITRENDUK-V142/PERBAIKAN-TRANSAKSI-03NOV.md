# Perbaikan transaksi — 3 November 2026
Dasar: source 31 Oktober; revisi 27 Oktober dengan koreksi 29 Oktober.

- Arsip: dropdown Keterangan dan Nasib Akhir menunggu keberhasilan API; bila gagal nilai lama dipulihkan. ID dibandingkan sebagai string agar data numerik tetap cocok. Kontrol dikunci selama permintaan.
- Pengguna: dropdown unit/peran/akses/status/aktivasi menunggu API; gagal berarti rollback, bukan sukses semu. Hanya kolom yang diizinkan bisa diedit. Pencocokan ID diperbaiki.
- Logbook: form tambah memvalidasi periode, pegawai, aktivitas, dan URL bukti HTTPS; tombol Simpan dikunci selama permintaan; form edit detail juga mencegah penyimpanan ganda.
- UI v93/source 31 Oktober tidak dirombak.

Lulus: npm run check; npm run frontend-test (15 halaman). Tidak diuji: browser end-to-end dan PostgreSQL lokal pengguna. Ini bukan klaim seluruh revisi final.
