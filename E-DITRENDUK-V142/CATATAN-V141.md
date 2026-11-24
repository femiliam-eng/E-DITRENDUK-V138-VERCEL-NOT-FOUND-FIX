# E-DITRENDUK V141 — 10 November 2026

Dasar: V140 Tahap 1 (mempertahankan patch V139 untuk login).
Perubahan:
- Landing login menggunakan gambar HD LOGINpage2.png pengguna, dengan layout responsif. Form dan kode login tetap sama.
- Gambar di-bundle sebagai assets/login-background-hd.png; ada salinan root dan public.
- Filter Arsip “Perlu diperiksa” membaca `ket`, bukan `keterangan`, sesuai field status yang digunakan.
- Judul di baris Jadwal/Agenda Kegiatan dan Task Deadline dapat diklik untuk membuka editor fokus masing-masing baris; tombol Simpan Perubahan tetap memanggil API update yang sudah ada.
- Tidak melakukan operasi apa pun pada database Supabase.
- Tidak mengubah server-postgres.js, api/index.js, atau backend/request-security.js.

PENTING: Belum diuji terhadap akun/layanan produksi; jangan deployment ke Production tanpa uji Preview terlebih dahulu.
Angka jumlah tugas di Beranda masih membutuhkan pemeriksaan data/kriteria bisnis produksi, tidak dipaksa ke angka tertentu.
