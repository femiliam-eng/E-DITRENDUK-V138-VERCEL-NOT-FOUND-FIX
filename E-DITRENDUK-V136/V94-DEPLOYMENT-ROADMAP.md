# E-DITRENDUK V94 — kesiapan URL publik

Status: **BELUM LAYAK PRODUKSI**. Audit ini sengaja menolak deployment sampai penghambat nyata selesai. V94 bukan migrasi PostgreSQL dan bukan URL publik.

## Yang sudah dikerjakan
- Menambahkan audit deployment 13 pemeriksaan, dapat dijalankan berulang tanpa mengubah database.
- Audit memeriksa penggunaan SQLite pada runtime, larangan PostgreSQL parsial di production, Compose SQLite, override tidak aman, paparan port PostgreSQL, pengguna Docker non-root, URL HTTPS, kecocokan origin, secret, koneksi database terkelola, storage privat, dan mode produksi.
- Pengujian audit memverifikasi penolakan konfigurasi tidak aman dan bahwa laporan tidak membocorkan nilai secret.
- Audit dimasukkan ke `release-check` sebagai pengujian regresi; **audit produksi itu sendiri** tidak dimasukkan sebagai gate yang harus lulus pada development, karena memang harus BLOCK sampai migrasi tuntas.

## Rencana eksekusi untuk URL matang
1. Refactor startup `server.js`: hentikan pemanggilan `openDatabase`, `initSchema`, `seed`, dan semua repository SQLite di jalur PostgreSQL. Pisahkan bootstrap berdasarkan driver dan jangan mengizinkan SQLite sebagai fallback ketika PostgreSQL gagal.
2. Migrasikan seluruh CRUD termasuk admin, audit, rapat/notulen, reset password, agenda/task, file metadata; pastikan query terotorisasi sesuai role dan transaksi konsisten.
3. Jalankan suite regression + pengujian integrasi PostgreSQL sungguhan (bukan mock), uji concurrency lintas instance, rollback transaksi, serta restore backup dan storage.
4. Buat proyek Supabase melalui akun pemilik, database staging terpisah dari produksi, bucket privat, least-privilege credentials; simpan secret di penyedia hosting, jangan commit `.env`.
5. Deploy staging pada hosting Node.js yang mendukung persistent service, TLS, environment secrets dan health checks. Uji dengan `npm run public-url-smoke` serta verifikasi CORS, CSRF, cookie, CSP, ukuran unggahan, storage, dan recovery.
6. Review operasional: akun admin awal non-default, MFA pada dashboard cloud, rotasi secret, backup terjadwal dan restore drill, monitoring, log retention, batas akses jaringan, dan SOP insiden.
7. Baru arahkan domain resmi/HTTPS ke hosting setelah persetujuan instansi dan sign-off UAT.

## Menjalankan audit
`npm run v94-deployment-audit-test` harus lulus.
`npm run v94-deployment-audit` **seharusnya gagal** dengan BLOCK pada source ini; exit code 2 adalah pengaman, bukan bug.

## Yang belum dapat dilakukan secara lokal
Membuat akun Supabase/hosting, menetapkan domain dan DNS, memverifikasi kredensial produksi, atau mengklaim URL aktif memerlukan akses dan persetujuan pemilik. Jangan membagikan password/token dalam chat.
