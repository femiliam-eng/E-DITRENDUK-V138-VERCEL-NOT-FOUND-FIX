# Revisi lanjutan — peninjauan tanggal dan integritas filter

## Perubahan

1. Agenda Kegiatan dan Task Deadline sekarang memiliki tombol **Periksa tanggal bermasalah** untuk memfilter baris yang tanggalnya kosong, tidak valid, atau berupa teks/rentang naratif. Filter ini dapat dikombinasikan dengan pencarian, status, dan urutan tanggal; ekspor CSV mengikuti hasil yang tampil.
2. Ringkasan data menampilkan jumlah baris dengan tanggal yang perlu diperiksa. Tombol Reset mengembalikan filter tanggal ke keadaan normal.
3. Parser tanggal tidak lagi menggunakan `Date.parse` untuk menebak tanggal berbentuk kalimat; tanggal yang tidak jelas dipertahankan sebagai data asli dan ditandai untuk ditinjau.
4. Form edit memberikan petunjuk perbaikan tanggal sumber yang kosong atau berbentuk teks.
5. Repository menempatkan tanggal kosong/tidak valid di akhir daftar **baik** urutan terbaru maupun terlama.
6. Disertakan pemeriksaan regresi dan perintah untuk membaca ringkasan audit SQLite sebelumnya tanpa mengubah data.

## Validasi

- `node scripts/revision-92-date-quality-test.js`
- `node scripts/revision-92-sqlite-data-review.js`
- `npm run check && npm run frontend-test && npm run revisi-27-29-test`

## Batasan

Laporan audit berasal dari SQLite yang sebelumnya diperiksa. Tidak ada migrasi Excel/PostgreSQL dalam perubahan ini. Angka persentase pengerjaan bukan hasil pengukuran kelulusan seluruh persyaratan.
