# Koreksi source 31 Oktober — 3 November 2026

Acuan: semua persyaratan REVISIAN27OKT26 tetap berlaku; REVISI29OKT26 mengganti hanya bagian yang dikoreksi.

## Dikerjakan pada paket ini
- Menghapus **dua pembungkus handler duplikat** untuk Repository dan RAKOM. Pembungkus lama memasang event `onchange` kedua, dapat mengirim PATCH ganda, dan menimpa rollback ketika server gagal.
- Mengembalikan RAKOM ke handler asinkron tunggal yang sudah mengatur perubahan status, persentase progress, dan rollback jika API gagal.
- Memastikan data RAKOM yang sukses disimpan disinkronkan ke cache bootstrap (`D.disposisi`) agar status tidak kembali saat render berikutnya.
- Menambahkan pilihan `Lengkap` pada status Repository agar status sumber tersebut tidak diam-diam berubah saat pilihan dropdown dipakai.
- Memperbaiki pencocokan ID status Logbook (string/number) dan fallback status sebelumnya.
- Mencegah Beranda error ketika data Monitoring tidak mempunyai nilai `verifikasi`.
- Menambahkan pengujian regresi untuk mencegah pembungkus ganda terpasang lagi.

## Validasi yang dijalankan
`npm run check`, `npm run frontend-test`, dan `node scripts/revisi-27-29-regression-test.js`.

## Belum dibuktikan
Belum diuji dengan sesi browser pengguna atau PostgreSQL aktif; ini **bukan** rilis final seluruh revisi. Seluruh fitur pada dokumen 27/29 Oktober tetap memerlukan pengujian fungsional akhir.
