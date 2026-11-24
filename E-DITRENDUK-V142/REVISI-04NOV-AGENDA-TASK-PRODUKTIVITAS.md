# Revisi 04 November — Agenda Kegiatan & Task Deadline

## Perubahan terimplementasi

- Toolbar ringkasan otomatis dari data API: jumlah baris terlihat/total; pada Task Deadline ditambah Done/Not yet sesuai filter aktif.
- Ekspor CSV hasil **filter dan pengurutan saat ini**, bukan seluruh data tanpa sengaja. Memuat BOM UTF-8 untuk pembacaan di Excel; nilai yang menyerupai formula CSV diberi awalan apostrof demi keamanan.
- Reset pencarian, urutan tanggal, dan filter status dengan satu tombol.
- Tombol Perbarui data untuk memuat ulang data API tanpa memuat ulang seluruh halaman.
- Perlindungan dari respons API lama yang datang belakangan: hanya permintaan terbaru yang boleh mengubah daftar.
- Penanganan respons daftar API tidak valid dan pesan gagal memuat.
- Validasi tanggal kalender saat menyimpan; tidak hanya mengandalkan pola teks YYYY-MM-DD.
- Tetap mempertahankan Hasil Kegiatan, status Done/Not yet, CRUD, lampiran, dan notifikasi antartab.

## Batas pengujian

Lulus pemeriksaan sintaks, kontrak frontend 15 halaman, regresi revisi, dan pemeriksaan fitur statis. Ekspor CSV, database PostgreSQL aktif, dan dua akun belum diuji secara end-to-end pada browser dan server nyata. Data Excel asli belum diimpor ulang dalam perubahan ini.
