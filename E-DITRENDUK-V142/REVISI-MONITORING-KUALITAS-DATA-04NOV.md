# Revisi Monitoring: filter, audit tanggal, dan ekspor

Basis: ZIP revisi Arsip 94%, dengan REVISIAN27OKT26 sebagai dasar dan REVISI29OKT26 sebagai koreksi.

## Fitur yang diterapkan
- Filter kualitas tanggal: Semua tanggal, Perlu diperiksa, Tanggal valid.
- Pencarian nama kegiatan, tim, kategori, tanggal, RO, dan Sub.
- Filter keuangan dan direktur tetap tersedia, bisa digabung dengan filter baru.
- Pengurutan terbaru/terlama mempertahankan tanggal tidak valid di akhir.
- Penghitung jumlah hasil dan jumlah tanggal yang perlu diperiksa.
- Reset filter seluruh kontrol.
- Ekspor CSV sesuai hasil pencarian/filter/urutan, dengan perlindungan formula spreadsheet.
- Tidak mengubah nilai tanggal sumber secara otomatis.

## Verifikasi
- `npm run check`
- `npm run frontend-test` (15 halaman)
- `node scripts/monitoring-quality-regression-test.js` (12 pemeriksaan)
- Pengujian langsung PostgreSQL aktif dan akun superadmin/pegawai belum dilakukan.

## Catatan
Persentase progres proyek merupakan estimasi, bukan ukuran kelulusan otomatis.
