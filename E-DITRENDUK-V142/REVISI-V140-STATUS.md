# E-DITRENDUK V140 — Revisi Frontend 9 November 2026 (tahap 1)

Basis: source V139 yang sudah mencakup perbaikan Origin login, dengan acuan REV9NOV26.docx.
Tidak mengubah server, API, struktur database, schema, SQL, atau data Supabase.

Sudah dikerjakan:
1. Beranda: sapaan mengikuti waktu dan nama pengguna, perjelas bahwa KPI tugas berasal dari Task Deadline (ID unik), bukan RAKOM. Label sinkronisasi tidak lagi menampilkan angka jam server yang berubah-ubah.
2. RAKOM: arahan direktur diatur rata kiri dan warna teks hitam; font toolbar/tabel diseragamkan.
3. Filter urut tanggal: dropdown dua-opsi di RAKOM, Monitoring, Repository, Logbook, Arsip disederhanakan menjadi tombol naik/turun, mempertahankan event change asli.
4. Profil: riwayat aktivitas disembunyikan dari dialog profil, tanpa menghapus data audit.
5. Arsip: penekanan warna status Lengkap (hijau) dan Musnah (merah). Filter 'Perlu diperiksa' memasukkan tanggal invalid ATAU keterangan belum Lengkap.
6. Pengguna: jarak label Hak akses modul dirapikan.

Belum dikerjakan:
- Mode fokus per kegiatan dan tombol Simpan Perubahan (perlu desain alur edit + validasi persistensi agar tidak menjanjikan simpan palsu).
- Penggantian visual background login menggunakan gambar HD final (belum diterima).
- Audit akar penyebab angka 40 vs 616 melalui query Supabase live: basis source memberi definisi, tetapi selisih data belum dapat divalidasi secara operasional.
- Tes end-to-end akun, database, dan deploy produksi belum dilakukan.

Peringatan deploy:
- Simpan salinan/commit versi produksi saat ini sebelum mengunggah.
- Jangan mengganti Environment Variables, jangan menjalankan reset/migration/impor ulang.
- Cek login, hak akses, semua modul, penyimpanan status Arsip, serta dashboard setelah deploy.
