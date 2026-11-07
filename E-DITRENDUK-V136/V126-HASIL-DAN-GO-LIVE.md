# E-DITRENDUK V126 — Kesiapan akun karyawan dan URL (5 November 2026)

## Yang benar-benar ditambah
- `scripts/v126-employee-go-live-gate.js`: pemeriksaan **read-only** satu perintah untuk konfigurasi produksi, koneksi + struktur PostgreSQL, dua bucket Storage privat, jumlah akun Superadmin/Pegawai aktif, hash akun aktif, dan URL HTTPS yang mengembalikan respons E-DITRENDUK yang benar.
- `npm run employee-go-live-gate` menjalankan pemeriksaan tersebut; keluar dengan status gagal jika salah satu syarat tidak terpenuhi.
- `scripts/v126-employee-go-live-gate-test.js`: skenario kegagalan akun kosong, hash akun kosong, URL gagal, database gagal, dan konfigurasi contoh.
- `npm run release-check`: diperluas dari 16 ke **17 kelompok tes**, termasuk tes V126.

## Cara menggunakan ketika hosting sudah tersedia
1. Konfigurasikan environment produksi pada secret manager hosting (jangan memasukkan kredensial ke ZIP atau chat).
2. Backup database. Jalankan `npm run postgres-migrate-safe` hanya setelah pemeriksaan plan, konfirmasi nama database target, dan persetujuan pengelola data.
3. Impor akun dan data asli dengan alur impor yang sudah ada, setelah backup dan dry-run. **ZIP ini tidak mengandung database akun asli.**
4. Jalankan `npm run live-dependencies` untuk menguji PostgreSQL dan Storage.
5. Jalankan `npm run employee-go-live-gate` dari environment produksi untuk menguji persyaratan teknis akun dan URL dalam satu langkah.
6. Lakukan UAT manual dengan akun Superadmin dan Pegawai sungguhan, cek hak akses menu, penambahan/edit data, unduhan dokumen, file lampiran, logbook, notifikasi, backup/restore.

## Pengukuran kemajuan yang tidak menyesatkan
- **Tes source**: 17/17 kelompok yang dijalankan lulus pada lingkungan lokal dengan fixture/mocks.
- **Pengujian URL dan akun secara live**: BELUM, karena database/hosting akun organisasi belum terhubung untuk pemeriksaan ini.
- **Persentase sebelumnya (96%)**: estimasi kesiapan source, tidak dapat dipakai sebagai angka kesiapan produksi.
- **100% produksi** baru layak diberikan setelah URL HTTPS berfungsi, data dan akun asli teruji, kontrol akses diverifikasi, serta backup/restore dan UAT disetujui.

## Riwayat revisi
Tetap mengacu pada REVISIAN27OKT26 sebagai daftar awal dan REVISI29OKT26 sebagai penyempurnaan/koreksi instruksi tersebut. Tes regresi revisi tetap menjadi bagian dari release-check.

**Penting:** gate ini membaca statistik jumlah akun dan beberapa modul saja. Tidak mengirim/menampilkan username, password hash, identitas pegawai, atau isi dokumen. Hitungan data bukan bukti bahwa semua data asli lengkap.
