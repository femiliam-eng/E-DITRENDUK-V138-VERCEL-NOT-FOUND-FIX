# E-DITRENDUK — Backend V17

Runtime HTTP saat ini **SQLite**. Node.js >= 22.5.0 diperlukan. PostgreSQL masih **tooling migrasi/staging**, bukan runtime API. Jangan menetapkan `DB_DRIVER=postgres` pada aplikasi utama sebelum adapter PostgreSQL diimplementasikan dan diuji.

## Lokal

```powershell
npm run migrate
npm run release-check
npm start
```

Buka `http://localhost:3000/` untuk halaman login. Frontend HTML/CSS/JS tetap bisa diedit; jangan pindahkan skrip ke inline `<script>` karena CSP melarang inline script.

## Backup dan restore

```powershell
npm run backup
npm run verify-backup -- backups/NAMA_FOLDER_BACKUP
npm run restore -- backups/NAMA_FOLDER_BACKUP --confirm
```

Backup baru menyertakan checksum SHA-256 per file, termasuk upload. Verifikasi V17 sengaja menolak backup manifest lama yang belum punya checksum; backup lama tidak otomatis rusak, tetapi perlu diperiksa melalui prosedur lama sebelum dipakai. Simpan backup di luar server dan uji pemulihan di lingkungan staging.

## Batasan

`release-check` menguji fungsi lokal dan pemeriksaan statis, bukan pengganti uji browser menyeluruh, pentest, atau pengujian server production.

## V18

Perintah tambahan: `npm run restore-drill -- backups/NAMA_FOLDER` untuk simulasi pemulihan tanpa mengubah data aktif, dan `npm run deploy-config-check -- .env` untuk pemeriksaan konfigurasi production. Runtime utama tetap SQLite. Frontend tetap HTML/CSS/JS dan dapat direvisi terpisah.

## Tambahan V19: pemeriksaan PostgreSQL

`npm run postgres-contract-test` memeriksa struktur secara offline dan ikut `npm run release-check`.

Setelah menjalankan `npm run postgres-apply` dan `npm run postgres-import` terhadap database PostgreSQL yang **khusus untuk pengujian**, jalankan `npm run postgres-parity` dengan `DATABASE_URL` yang mengarah ke database itu. Perintah parity hanya membaca dan membandingkan jumlah baris per tabel. Jangan melakukan import ulang pada database produksi yang sudah berisi data aktif tanpa rencana migrasi/rollback.

**Status:** aplikasi HTTP tetap menggunakan SQLite; `DB_DRIVER=postgres` belum didukung sebagai runtime aplikasi. Jangan mengubah driver production menjadi postgres dulu.

## V20 — pemeriksaan integritas paket

- `npm run release-manifest` membuat daftar SHA-256 dan ukuran file sumber sebelum ZIP dibuat.
- `npm run verify-release` memverifikasi bahwa file rilis belum berubah. Ini bukan pengganti audit keamanan, signature digital, atau pengujian runtime.
- `npm run postgres-live-gate` memerlukan PostgreSQL staging dan `DATABASE_URL`; memeriksa koneksi dan jumlah record, **bukan** kesetaraan endpoint PostgreSQL.

### V21 — Data parity
`npm run postgres-data-parity-test` untuk test offline; `npm run postgres-data-parity` untuk membandingkan isi 7 tabel JSON pada PostgreSQL staging (butuh `DATABASE_URL` dan `psql`). HTTP runtime masih SQLite.

### V22: pemeriksaan runtime database

`npm run postgres-runtime-readiness` menampilkan inventaris kode SQLite yang perlu dimigrasikan sebelum runtime PostgreSQL dapat dipakai. Untuk output JSON, jalankan `npm run postgres-runtime-readiness -- --json`. `DB_DRIVER=postgres` sengaja ditolak oleh server agar tidak diam-diam memakai SQLite.

### V23: inventaris kompatibilitas SQL

Jalankan `npm run postgres-sql-audit` atau `npm run postgres-sql-audit -- --json` untuk memeriksa query SQLite yang harus diubah sebelum membuat adapter PostgreSQL. Audit ini bukan pengujian PostgreSQL live dan tidak mengubah database.

## V24 — Modul akses database

`backend/database.js` menyediakan `openDatabase({driver,dataDir})` dan `normalizeDriver(driver)`. Saat ini hanya `sqlite` yang didukung. `npm run database-adapter-test` menguji guard driver, PRAGMA, dan CRUD SQLite. Penggantian runtime PostgreSQL membutuhkan refactor query dan endpoint asynchronous; belum tersedia.

## V25 — Repository payload

`backend/payload-repository.js` memusatkan operasi list/save untuk tujuh tabel payload dan membatasi nama tabel lewat whitelist. Jalankan `npm run payload-repository-test` untuk tes CRUD. Implementasi masih SQLite sinkron, belum PostgreSQL runtime.

### V26 — Session repository

Query sesi di `backend/session-repository.js`; tes: `npm run session-repository-test`. Database runtime masih SQLite.

### V27
Akses akun dan reset password menggunakan `backend/account-repository.js`. Uji: `npm run account-repository-test`. Runtime tetap SQLite.

### V28: repository audit & storage

- `backend/audit-repository.js`: pencatatan, pencarian berfilter dan pagination, aktivitas akun.
- `backend/storage-repository.js`: metadata file notulen; operasi filesystem tetap di handler.
- Tes: `npm run audit-storage-repository-test`. Runtime masih SQLite.

### V30 — Validasi payload notulen

`backend/meeting-validation.js` menyediakan `validateMeetingPayload(body)` yang mengembalikan pesan kesalahan atau `null` jika valid. Jalankan `npm run meeting-validation-test`. Manifest rilis sekarang memeriksa kode backend juga, tetapi tidak mencakup file database runtime.

## V31: Pengujian PostgreSQL langsung
Jalankan `npm run postgres-live-smoke` setelah mengatur `DATABASE_URL` dan membuat skema dengan `npm run postgres-apply`. Pengujian menulis lalu membatalkan perubahan (ROLLBACK). HTTP runtime **masih SQLite**.

### V32: modul PostgreSQL tahap pertama
`backend/postgres-payload-repository.js` adalah modul async terpisah untuk tujuh tabel JSONB. Jalankan `npm run postgres-payload-adapter-test` untuk self-test dengan client tiruan. Modul ini belum digunakan server HTTP; website masih SQLite. Integrasi PostgreSQL live memerlukan driver `pg` dan refaktor server ke query async.

V33: `npm run postgres-account-adapter-test` menguji adapter akun PostgreSQL secara offline. Runtime HTTP masih SQLite; koneksi PostgreSQL live diuji terpisah melalui `npm run postgres-check`.

### V34 PostgreSQL session adapter
`npm run postgres-session-adapter-test` memeriksa kontrak query session async secara offline. Belum dipakai runtime HTTP.

### V35
`backend/postgres-audit-repository.js` dan `backend/postgres-storage-repository.js` adalah adapter async PostgreSQL terpisah. Uji: `npm run postgres-audit-storage-adapter-test`. Belum dihubungkan ke server HTTP.

### V36 — preview baca langsung PostgreSQL
Jalankan `npm install`, lalu set `DATABASE_URL` dan `PG_READ_PREVIEW=1` di terminal yang sama sebelum `npm start`. Login seperti biasa (akun masih SQLite), lalu `GET /api/postgres-preview/monitoring?limit=25` menggunakan sesi login. Preview tersedia untuk monitoring, logbook, archive, users_data, disposisi, petugas, schedules. Ini bukan pengganti API utama.

V37: preview PostgreSQL kini mendukung `page`, `limit`, total halaman, dan GET detail ID. Aktifkan `PG_READ_PREVIEW=1` hanya untuk pengujian; autentikasi masih SQLite.

## V38: parity PostgreSQL via HTTP
Set `PG_READ_PREVIEW=1` dan `DATABASE_URL`, login sebagai Superadmin, lalu GET `/api/postgres-preview-parity`. cuma jumlah baris dibandingkan, bukan isi data. Endpoint ini ga mengubah database.


### V39 PostgreSQL write preview
Dengan `PG_READ_PREVIEW=1`, `PG_WRITE_PREVIEW=1`, dan `DATABASE_URL`, Superadmin dapat menguji POST `/api/postgres-write/monitoring`, PATCH/PUT/DELETE `/api/postgres-write/monitoring/:id` (berlaku juga untuk logbook, archive, users_data, disposisi, petugas, schedules). Mengubah data PostgreSQL sungguhan. Login dan audit tetap SQLite; jangan gunain untuk produksi.

## V40
Pengumpulan hasil notulensi: `GET/POST /api/notulen-submissions`, `GET /api/notulen-submissions/:id/file`. Semua perlu sesi login. File disimpan di `uploads/notulen`, metadata di tabel `notulen_submissions` SQLite. Maksimal 6 MB; PDF/DOC/DOCX.


## V41 (revisi dari V40) — Pengumpulan notulensi tanpa tim kerja
- Kolom **Tim Kerja** dihapus dari formulir pengumpulan hasil notulensi.
- Daftar hasil pengumpulan tidak lagi menampilkan tim kerja atau placeholder tim.
- API unggah mengabaikan atribut tim untuk pengumpulan baru; kolom lama dipertahankan agar dokumen sebelumnya tidak rusak.
- Semua pegawai tetap dapat mengunggah hasil rapat; tampilan unit kerja di Beranda tetap ada.
- Ditambahkan tes regresi `npm run notulen-no-team-test`.
- Paket distribusi mengecualikan database SQLite lokal, WAL/SHM, dan dokumen unggahan; jangan gunakan versi ini sebagai bukti keamanan produksi.

## V42 — Pengamanan server
- `NODE_ENV=production` mensyaratkan `SESSION_SECRET` minimal 32 byte dan tidak mengizinkan password bawaan `Ditrenduk2026!` pada akun mana pun.
- Akun demo tidak dibuat otomatis saat startup production; administrator harus diprovisi dan password dirotasi melalui proses aman sebelum deploy.
- `ALLOW_SQLITE_PUBLIC=I_UNDERSTAND_THE_RISK` adalah override berisiko, **bukan** rekomendasi deploy atau bukti kesiapan. PostgreSQL HTTP utama masih belum tersedia.
- Static files dibatasi dan folder unggahan tidak dapat diakses secara langsung; unduh notulensi tetap melalui API yang mensyaratkan sesi.
- Jalankan `npm run security-v42-test` dan `npm run release-check` sebelum rilis.

## V43 — pengamanan unggahan dan origin
- Pengumpulan notulensi: batas 20 unggahan per akun per 15 menit, pemeriksaan tanggal kalender, nama file/ekstensi, dan signature PDF/DOC/DOCX.
- Origin development localhost tidak lagi diizinkan sebagai pengecualian pada production. Cookie logout memakai Secure saat production.
- Runtime HTTP tetap SQLite; PostgreSQL utama, backup dan audit keamanan independen belum selesai. Jangan gunakan data instansi asli pada hosting publik.

### V44 penyimpanan notulensi
`NOTULEN_UPLOAD_DIR` (absolute path) mengatur lokasi file; wajib pada production dan harus di luar root proyek. `CONFIRM_PERSISTENT_UPLOAD_STORAGE=YES` wajib di production setelah operator memverifikasi volume dan backup. Tidak ada migrasi otomatis dari folder unggahan lama.

### V45: PostgreSQL sumber data utama tujuh modul (hanya development)
Gunakan PostgreSQL lokal yang sudah disiapkan dan diimpor: set `DATABASE_URL`, `PG_READ_PREVIEW=1`, `PG_PRIMARY_PAYLOAD=1`, kemudian `npm start` dalam mode development. API standar `/api/monitoring`, `/api/logbook`, `/api/archive`, `/api/users`, `/api/disposisi`, `/api/petugas`, `/api/schedules`, `/api/bootstrap`, `/api/dashboard`, dan ekspor terkait membaca/menulis payload PostgreSQL. Jangan set `DB_DRIVER=postgres`: login, session, audit, notulensi dan beberapa komponen lain masih SQLite. Jangan gunakan mode hybrid di production.


### V46 PostgreSQL
`npm run postgres-notulen-migrate` membuat tabel pengumpulan notulensi di database PostgreSQL yang telah ada. Sebelum `npm run postgres-import`, backup kedua database dan pastikan migrasi telah berjalan. Import tidak menyalin file fisik upload. Server HTTP masih hybrid SQLite/PostgreSQL dan belum disetujui untuk data asli di internet.

### V47: pemeriksaan PostgreSQL nyata (read-only)
Jalankan `npm install`, set `DATABASE_URL` dan `PGPASSWORD` melalui environment lokal, lalu `npm run postgres-runtime-gate`. Pemeriksaan membaca versi database, tabel, jumlah baris, dan izin akun tanpa mengubah data. `postgres-runtime-gate-test` adalah tes mock, berbeda dari koneksi nyata. Jika ada tabel hilang, periksa migrasi V46. Jangan bagikan nilai password.

### V48 — Uji CRUD langsung PostgreSQL
Set `DATABASE_URL` dan `PGPASSWORD` pada PowerShell, lalu `npm run postgres-primary-live-crud`. Uji memakai transaksi ROLLBACK; tetap gunakan database pengujian karena perintah melakukan INSERT/UPDATE/DELETE sementara. Driver `pg` kini menerima `PGPASSWORD` juga pada HTTP gateway.

### V49: pengujian autentikasi PostgreSQL langsung
Jalankan `npm run postgres-auth-live-smoke` setelah `DATABASE_URL` dan `PGPASSWORD` disiapkan. Tes memakai transaksi ROLLBACK dan tidak membuat akun permanen. Runtime autentikasi HTTP masih SQLite.

### V50 pengujian autentikasi PostgreSQL
Set `PG_READ_PREVIEW=1`, `PG_PRIMARY_AUTH=1`, `DATABASE_URL`, `PGPASSWORD` pada lingkungan development. Hanya endpoint login, me, logout dan health tersedia pada mode ini; endpoint fitur lain 503. Akun PostgreSQL harus telah diprovisi. Jangan gunakan untuk production.

## V51 — PostgreSQL auth self-service (development only)
- Mode `PG_PRIMARY_AUTH=1` kini menghubungkan HTTP `POST /api/auth/change-password`, `GET /api/auth/sessions`, dan `DELETE /api/auth/sessions/:id` ke repository PostgreSQL.
- Pemeriksaan sesi dan kepemilikan dilakukan melalui PostgreSQL, bukan SQLite. Perubahan password mencabut sesi lain.
- Tes kontrak `postgres-auth-selfservice-test` ditambahkan ke `release-check`.
- **Batasan:** mode ini tetap development-only; API modul lain tetap dinonaktifkan dalam mode PG_PRIMARY_AUTH. Belum siap deployment publik, belum diverifikasi ke PostgreSQL 18 pengguna.

### V57 — perbaikan akar masalah identitas dan notifikasi
- `js/api.js` kini mengekspor `window.API = API`. Sebelumnya `const API` hanya tersedia sebagai global lexical binding, sementara `js/layout.js` memeriksa `window.API`, sehingga pemuatan sesi `/api/auth/me` dilewati, nama akun menjadi placeholder, dan notifikasi Superadmin tidak pernah diambil.
- Tes regresi `npm run frontend-api-global-test` memverifikasi ekspor API. Setelah update, restart server dan hard refresh browser.


V58: Notifikasi reset Superadmin kini menggunakan endpoint /api/password-reset-requests yang sama dengan tabel Pengguna, memfilter status Menunggu, dan mematikan cache. Pemeriksaan role menu Pengguna dibuat case-insensitive. Uji akun aktual tetap diperlukan.

## V59 — Fail-closed session dan data workspace
Workspace sekarang menolak akses bila API/session gagal dimuat, identitas akun tidak lengkap, atau bootstrap data backend gagal. Tidak lagi diam-diam menampilkan data frontend yang bisa menyesatkan pengguna. Tes: `npm run frontend-auth-failclosed-test`. Perubahan ini bukan pengganti integrasi PostgreSQL penuh atau hosting production.
\n\n## V60 — Pemeriksaan kelayakan operasional\n\n`npm run production-readiness-gate` memeriksa prasyarat produksi dan **sengaja gagal** selama seluruh HTTP runtime belum menggunakan PostgreSQL. `npm run production-readiness-gate-test` memverifikasi perilaku fail-closed. Gate bukan bukti deployment, dan tidak mengaktifkan URL publik.\n