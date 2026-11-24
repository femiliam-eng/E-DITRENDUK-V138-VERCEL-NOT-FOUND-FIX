# Revisi kualitas data Arsip — 4 November 2026

Acuan: REVISIAN27OKT26 (dasar), REVISI29OKT26 (koreksi).

## Perubahan

- Pencarian arsip diperluas ke nomor, kode, item, uraian dan media.
- Filter **Tanggal perlu diperiksa** mengidentifikasi nilai kosong/tidak dapat dipastikan sebagai tanggal kalender.
- Tanggal yang valid selalu diurutkan lebih dulu, baik urutan terbaru maupun terlama; tidak memutasi array data asli.
- Ringkasan jumlah arsip yang terlihat dan jumlah tanggal perlu diperiksa.
- Reset filter serta ekspor CSV hanya untuk baris yang tampil, dengan UTF-8 BOM dan pengamanan formula spreadsheet.
- Tabel tetap 12 kolom, nilai kosong tampil sebagai em dash, dan nilai status yang belum termasuk opsi baku dipertahankan.
- Perubahan status tetap memakai wrapper backend API yang sudah ada.

## Pengujian

`npm run check`, `npm run frontend-test`, `npm run revisi-27-29-test`, `npm run archive-quality-test`.

## Batasan

Pengujian di atas bukan pengujian UI browser langsung atau PostgreSQL live. Belum ada klaim data Excel asli telah diimpor atau deployment dilakukan. Persentase progres proyek adalah estimasi, bukan ukuran otomatis kelulusan persyaratan.
