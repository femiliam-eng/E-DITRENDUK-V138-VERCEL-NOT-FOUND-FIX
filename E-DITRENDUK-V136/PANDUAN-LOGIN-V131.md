# V131 — Perbaikan login localhost (tanpa menghapus data)

**Akar masalah dari terminal pengguna:** migrasi PostgreSQL berhasil pada mode `fresh`. Database `editrenduk` baru tidak otomatis memuat akun dari SQLite lama. `npm start` hanya menunjukkan HTTP listener hidup, bukan login tersedia. `npm run employee-go-live-gate` memeriksa produksi HTTPS, jadi tidak cocok untuk debugging `localhost`. V130 `postgres-check` salah mewajibkan executable `psql` walau Node driver `pg` tersedia; V131 memperbaikinya.

1. Buka folder proyek V131 di VS Code. `npm install`.
2. Set `DATABASE_URL` **dari database lokal yang sama dengan migrasi** menggunakan environment terminal (jangan masukkan credential ke chat). Jalankan `npm run postgres-check`; perintah ini tidak butuh psql.
3. Jalankan `npm run recover-local-accounts` untuk menemukan SQLite lama di Downloads beserta **jumlah akun saja**. Pilih database E-DITRENDUK dengan akun lama, bukan yang dari proyek lain.
4. Lakukan **backup SQLite lama dan backup PostgreSQL**. Untuk cek tanpa menulis, jalankan `npm run recover-local-accounts -- --source="C:\\path\\ke\\file-lama.sqlite"`.
5. Periksa output dry-run. Untuk menyalin hanya akun yang belum ada dan tanpa menimpa ID yang sudah ada, set `$env:CONFIRM_AUTH_IMPORT="YES"` lalu `npm run recover-local-accounts -- --source="C:\\path\\ke\\file-lama.sqlite" --apply`. Sesudahnya, `$env:CONFIRM_AUTH_IMPORT=""`.
6. Jalankan `npm run postgres-check`, kemudian `npm start` dan buka http://localhost:3000/login.html.

**Penting:** perintah ini memigrasikan akun dan password **hash**, bukan password polos. Tidak mengganti password. Belum memindahkan semua data kegiatan/dokumen; migrasi isi modul harus dilakukan terpisah. Jika tidak ada SQLite sumber yang cocok, jangan klaim akun lama masih tersedia. Baru gunakan `bootstrap-first-superadmin` untuk membuat admin baru *jika* memang ini instalasi baru dan setelah mendapat izin pemilik sistem.

**Keamanan:** dalam log yang dibagikan sebelumnya tampak password database. Ganti/rotasi password PostgreSQL tersebut, lalu perbarui DATABASE_URL setempat; jangan unggah credential ke chat atau repository.
