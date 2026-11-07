# V83 — Audit penghambat PostgreSQL penuh

Audit offline otomatis: `npm run runtime-inventory` (JSON: `node scripts/v83-runtime-inventory.js --json`).

## Temuan kode (bukan uji koneksi Supabase)
- `server.js` masih membuka SQLite.
- Terdapat 28 baris dengan pola pemanggilan SQL SQLite langsung.
- Enam inisialisasi repository lama masih ada.
- Jalur PostgreSQL diaktifkan melalui beberapa flag, belum satu runtime penuh.
- Production-readiness gate sengaja tetap BLOCK.

Angka di atas adalah jumlah baris yang cocok dengan pola, **bukan** jumlah endpoint.
Jangan menyamakan tes simulasi lulus dengan migrasi database selesai.

## Urutan pekerjaan untuk versi gabungan selanjutnya
1. Petakan setiap endpoint API ke tabel/repository sumber dan jenis operasi (GET/POST/PATCH/DELETE).
2. Migrasikan satu kelompok endpoint pada satu waktu dengan kontrak API dan uji izin akses.
3. Hilangkan akses SQLite di jalur production; jalankan tes paritas data dan migrasi dengan database staging.
4. Uji Superadmin/Admin/Pegawai, notulensi private storage, agenda/task, audit dan reset password.
5. Jalankan backup/restore drill PostgreSQL dan bucket Storage menggunakan data uji.
6. Baru evaluasi production-readiness gate, konfigurasi HTTPS, dan domain resmi yang disetujui.

## Batasan
Tidak ada kredensial Supabase/hosting pada paket ini. Pengujian live tidak dijalankan.
Audit bersifat statis dan dapat meleset jika pola kode berubah; perlu review manual.
