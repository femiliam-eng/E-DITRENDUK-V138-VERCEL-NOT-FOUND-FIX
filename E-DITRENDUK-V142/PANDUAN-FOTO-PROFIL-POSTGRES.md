# Foto profil PostgreSQL

1. Jalankan `migrations/2026-10-28-profile-photo.sql` sekali di PostgreSQL yang sudah digunakan aplikasi.
2. Jalankan server dengan `npm start` atau perintah yang biasa dipakai.
3. Login, klik nama akun kanan atas, pilih **Ubah foto profil**.
4. Foto disimpan sebagai BYTEA di PostgreSQL dan hanya bisa dibaca melalui sesi akun sendiri.

Batas foto 250 KB, PNG/JPEG/WEBP. Tidak ada migrasi ulang SQLite.

**Belum diuji terhadap instance PostgreSQL pengguna.**
