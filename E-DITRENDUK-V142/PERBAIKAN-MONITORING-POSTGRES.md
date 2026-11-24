# Perbaikan Monitoring PostgreSQL

- Tim Kerja Penanggung Jawab menjadi dropdown PARAMETER (hijau), PJPK (biru muda), Manajemen Kinerja (ungu muda). Nilai lama yang tidak termasuk pilihan tetap ditampilkan agar tidak hilang.
- Kategori Kegiatan menjadi dropdown, termasuk kategori lama yang ditemukan dalam data.
- Semua perubahan Monitoring (dropdown, checklist, kolom teks, validasi) kini menunggu respons API PATCH PostgreSQL dan mengembalikan nilai sebelumnya bila penyimpanan gagal.
- Tidak memerlukan migrasi ulang SQLite atau perubahan skema.
- Belum diuji end-to-end dengan PostgreSQL lokal pengguna.
