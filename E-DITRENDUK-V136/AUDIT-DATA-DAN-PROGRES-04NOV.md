# Audit integritas data dan perbaikan 4 November 2026

## Data bawaan vs SQLite lokal (read-only)

Hasil perbandingan **isi payload lengkap**, bukan hanya jumlah baris: Monitoring 43/43, RAKOM (disposisi) 225/225, Logbook 246/246, Arsip 271/271, Pengguna 21/21, Petugas 15/15. Total 821/821 isi baris cocok. Identitas database `petugas` tidak terdapat di data bawaan, sehingga perbandingan dilakukan berdasarkan isi payload, bukan ID.

SQLite juga berisi Agenda 393, Task Deadline 53, Jadwal Petugas 5. Ketiga modul ini tidak tersedia di `js/data.js` untuk dibandingkan satu per satu; angka tersebut bukan bukti kesesuaian dengan file Excel sumber.

## Temuan kualitas data yang perlu ditindaklanjuti

- Agenda: 393 baris; 0 duplikat ID, 0 kegiatan kosong, 0 tanggal kosong, 0 tanggal non-ISO.
- Task Deadline: 53 baris; 0 duplikat ID, 0 tugas kosong, **15 deadline kosong**, **6 deadline non-ISO** yang berisi teks seperti `Februari` atau rentang tanggal. Tidak aman mengubahnya otomatis menjadi tanggal tertentu.
- Monitoring: 43 baris; 0 duplikat ID, 0 nama kosong, **1 tanggal kosong**, **5 tanggal non-ISO** termasuk format Indonesia `19/08/2026` dan rentang `21 & 23 April 2026`.
- RAKOM: 225 baris; 0 duplikat ID dan 0 perihal kosong.

## Perbaikan kode

1. Agenda/Task: tanggal kosong/tidak terbaca sekarang berada di akhir urutan **baik terbaru maupun terlama**; sebelumnya dapat muncul di awal saat memilih tanggal terlama.
2. Jadwal Petugas: tanggal tidak valid/kosong tetap berada di akhir urutan pada kedua arah.
3. Ekspor CSV Agenda/Task: nilai yang diawali spasi lalu `=`, `+`, `-`, atau `@` juga diproteksi dari interpretasi formula spreadsheet.
4. Menambahkan skrip audit yang dapat diulang untuk menguji kecocokan payload dan kualitas data, tanpa memodifikasi SQLite.

## Cara mengulang audit

```bash
python scripts/source-data-parity-audit.py --sqlite /path/to/editrenduk.sqlite
python scripts/source-data-quality-audit.py --sqlite /path/to/editrenduk.sqlite
npm run check
npm run frontend-test
```

## Batasan

Belum ada bukti verifikasi baris demi baris terhadap workbook Excel asli, belum ada CRUD pada PostgreSQL aktif, dan belum ada pengujian dua akun. Tidak ada deployment. Progres total yang dikomunikasikan adalah estimasi, bukan metrik persyaratan yang diaudit.
