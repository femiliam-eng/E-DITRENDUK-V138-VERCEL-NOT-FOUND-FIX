# E-DITRENDUK V130 — Perbaikan pengingat & progres go-live terukur

**Dasar kebutuhan:** REVISIAN27OKT26 (dasar) lalu REVISI29OKT26 (penyempurnaan); tidak dinilai sebagai dua revisi yang terpisah.

## Perubahan source nyata
1. Pengingat `/api/reminders` sekarang menggunakan tanggal valid ISO `YYYY-MM-DD` dan tanggal Indonesia `DD/MM/YYYY`, `DD-MM-YYYY`, `DD.MM.YYYY` tanpa `Date.parse` ambigu.
2. Menolak tanggal tidak masuk akal (31 November, 29 Februari nonkabisat), dan memakai hari kalender **Asia/Jakarta** walaupun server berada di timezone lain.
3. Pengingat hanya menampilkan agenda/task hari ini sampai 7 hari ke depan dan mengabaikan status Done/final.
4. Tes V130 memanggil handler pengingat yang sama dengan runtime, termasuk tanggal batas, hari kabisat, status selesai, dan kasus server UTC = 1 AM WIB.
5. Ditambahkan `npm run go-live-progress` yang menilai lima gate operasional dari hasil nyata, bukan estimasi proyek.
6. Ditambahkan pengujian progres dengan skenario lulus semua, konfigurasi absen, database gagal, URL/akun gagal, login gagal, dan kesalahan internal tanpa kebocoran informasi rahasia.

## Bukti yang dijalankan pada 5 November
- `npm run release-check`: **22/22 kelompok lulus**, dibanding 20/20 pada V129. **Jumlah kelompok tes meningkat 10%** (20 menjadi 22); ini bukan kenaikan 10 poin kesiapan aplikasi.
- `node scripts/v130-reminder-calendar-test.js`: LULUS.
- `node scripts/v130-go-live-progress-test.js`: LULUS.
- `npm run go-live-progress`: **1/5 gate go-live terverifikasi (20%)** di lingkungan pemeriksaan saat ini. Source/regresi lokal lulus. Konfigurasi hosting, PostgreSQL+Storage online, akun+URL, dan uji dua peran belum tersedia, sehingga tidak diklaim lulus.

## Agar benar-benar bisa dipakai karyawan lewat URL
1. Hubungkan project hosting milik organisasi dan PostgreSQL online. Jangan kirim password database atau service role key ke chat, kode atau ZIP; simpan lewat secret manager penyedia hosting.
2. Pasang dua bucket Storage Supabase privat (notulensi dan lampiran Agenda).
3. Jalankan migrasi aman sesuai V123 pada database yang benar, lakukan backup sebelum migrasi data lama.
4. Buat akun Superadmin pertama dengan prosedur V128 (khusus database kosong) dan minimal satu akun Pegawai aktif.
5. Jalankan `npm run release-check`, `npm run go-live-progress`, dan `npm run employee-acceptance-live` dengan kredensial uji dari environment yang terlindungi.
6. Verifikasi lampiran benar-benar bisa diunggah/dibuka, kesesuaian data sumber, backup-restore, lalu dapatkan persetujuan PIC sebelum membagikan URL kepada pegawai.

**Batasan:** Tanpa koneksi hosting, database dan akun organisasi, URL produksi tidak dapat dinyatakan aktif atau diuji. Kelulusan 22 tes lokal tidak menggantikan UAT/keamanan produksi.
