# E-DITRENDUK V135 — Revisi 7 November 2026

Basis: source ZIP V134 yang diunggah pengguna. **Semua 7 revisi difokuskan pada frontend.** Tidak ada reset, migrasi, impor, atau perubahan data langsung di Supabase.

## Perubahan yang dikerjakan
1. Beranda: angka progres tugas minggu ini selalu tampil sebagai persen, ditambah jumlah tugas selesai / total. Bila tidak ada tugas yang jatuh tempo minggu ini, tampil `0%` dengan penjelasan `Belum ada tugas dengan tenggat minggu ini`, bukan angka kemajuan palsu.
2. Repository: filter `Semua / Final / Belum lengkap / Draf` menggunakan status yang telah dinormalisasi; `Final` dan `Lengkap` hijau, `Diperiksa` kuning, `Draf` biru, status yang belum lengkap merah. Pilihan status dari data lama tidak dihilangkan, filter menampilkan jumlah hasil.
3. Arsip: warna Nasib Akhir diatur `Musnah` merah, `Dinilai Kembali` kuning lembut, `Permanen` biru muda; nilai tak dikenal abu-abu (tidak disamakan dengan Permanen). Warna langsung berubah saat status berhasil disimpan.
4. Foto profil: setiap ukuran/aspek gambar dipotong tengah menjadi 256×256, hasil pratinjau dan avatar selalu terpotong bulat, lalu dikompres JPEG maksimal 250 KB sebelum dikirim lewat endpoint yang sudah ada.
5. Profil Saya: setelah foto tersimpan, header dan avatar di dialog profil disegarkan dengan cache-busting; dihapus pun keduanya kembali ke inisial.
6. Header: `Direktorat Perencanaan Pengendalian` baris pertama, `Penduduk` baris kedua; `One Work Portal` tetap di bawah. Lebar brand disesuaikan untuk desktop dan mobile.
7. Jenis Fasilitasi: form dan filter diubah menjadi grid responsif, mengikuti dimensi, padding, tipografi, dan gaya kartu menu lainnya.

## Validasi
- `node scripts/v135-revisi07-test.js`: lulus 7 kelompok pemeriksaan.
- `node scripts/frontend-contract-test.js`: lulus 15 halaman.
- `node scripts/revisi-27-29-nov4-regression-test.js`: lulus 14 regresi.
- Node syntax check: `js/app.js`, `js/layout.js`, `js/fasilitasi.js`, `api/index.js`, `server-postgres.js` lulus.

## Supabase
Proyek yang sudah terhubung `e-ditrenduk` (project ref `hgefzuctqokmlaruugjh`) **tidak diubah** oleh revisi ini. Semua data lama dibiarkan sebagaimana adanya.

## URL publik / Vercel
Saat pembuatan proyek Vercel `e-ditrenduk` di team `AVENGERS`, API Vercel mengembalikan `403 forbidden: You don't have permission to create the project`. Karena itu **belum ada URL publik aktif untuk V135**. Pemilik workspace harus memberikan izin membuat proyek atau membuat project `e-ditrenduk` di dashboard Vercel. Pengaturan lingkungan rahasia hosting (`DATABASE_URL`, `SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, dan lain-lain) harus dibuat melalui dashboard; jangan kirim password dalam chat.

Setelah proyek dan environment tersedia, deploy source ini memakai konfigurasi `vercel.json` yang ada; jalankan smoke test pada preview URL sebelum produksi. Situs lokal dapat dijalankan dengan `npm install`, set environment koneksi database, `npm start`, kemudian buka `http://localhost:3000/login.html`.
