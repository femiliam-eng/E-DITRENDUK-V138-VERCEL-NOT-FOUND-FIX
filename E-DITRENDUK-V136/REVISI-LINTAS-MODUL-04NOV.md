# Revisi lintas modul 4 November 2026

- Arsip: dropdown Keterangan dan Nasib Akhir kini memakai delegated change handler, sehingga perubahan tetap disimpan setelah tabel diurutkan atau dicari. Nilai baru diterapkan setelah API mengonfirmasi; jika gagal, pilihan dikembalikan.
- Logbook: daftar periode mengikuti seluruh nama bulan dan tahun dari data, bukan hanya April–Juli 2026.
- Logbook: tombol buka bukti hanya menerima tautan HTTPS dan menggunakan noopener/noreferrer.
- Kode: dua implementasi awal pageLogbook dan pageArsip yang telah digantikan dihapus; prompt browser usang ikut dihapus.
- Source 31 Oktober, Jenis Fasilitasi, Agenda, Task, dan konfigurasi Supabase/Vercel sebelumnya dipertahankan.

## Batas verifikasi
Pengujian frontend/sintaks bukan pengujian PostgreSQL aktif atau browser end-to-end. Deployment belum dilakukan.
