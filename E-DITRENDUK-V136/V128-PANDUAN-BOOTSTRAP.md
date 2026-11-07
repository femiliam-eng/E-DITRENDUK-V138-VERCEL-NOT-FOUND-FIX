# V128 — Bootstrap Superadmin pertama

Untuk PostgreSQL **yang telah dimigrasi dan tabel `accounts` masih kosong**, jalankan dari terminal administrator setelah memperoleh izin pemilik sistem. Perintah ini mengubah database, tidak termasuk release-check read-only.

1. Set `DATABASE_URL`, `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PASSWORD` sebagai environment secrets, bukan disimpan di repository. Password sementara minimal 14 karakter dengan huruf besar, kecil, angka, simbol.
2. Set `BOOTSTRAP_CONFIRM=CREATE_FIRST_SUPERADMIN_ON_EMPTY_DATABASE` hanya saat eksekusi yang disetujui.
3. Jalankan `npm run bootstrap-first-superadmin` di lingkungan terlindungi.
4. Hapus semua variabel `BOOTSTRAP_*` dari environment setelah sukses. Masuk sebagai Superadmin dan ubah kata sandi. Buat akun Pegawai melalui menu Pengguna; jangan bootstrap akun organisasi tanpa izin.
5. Jalankan `npm run employee-acceptance-live` setelah URL HTTPS, database, bucket privat dan akun uji Pegawai tersedia.

Bootstrap menolak database yang sudah punya akun, memakai PostgreSQL advisory lock dan transaksi, tidak menyimpan password polos, tidak mencetak secret, dan tidak membuat akun Pegawai otomatis. Pengujian lokal tidak membuktikan deployment produksi.
