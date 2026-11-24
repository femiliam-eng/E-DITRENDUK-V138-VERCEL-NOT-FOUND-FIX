# E-DITRENDUK — Catatan Revisi

## Arahan mentor (dibawa dari V15)

- Landing page publik dihilangkan; akses modul E-DITRENDUK dari website induk diarahkan ke login E-DITRENDUK.
- Login tetap tersedia dengan animasi.
- Peran pengguna: **Superadmin** dan **Pegawai**. Detail matriks hak akses menunggu konfirmasi mentor.
- Integrasi SSO/autentikasi website induk **belum dibuat**.

## V16

- Peningkatan konfigurasi Docker, contoh `.env` production, audit konfigurasi, dan pemeriksaan backup.

## V17

- Backup menghasilkan manifest berisi SHA-256 dan ukuran setiap file database/upload.
- `verify-backup` memeriksa checksum, file tambahan/hilang, dan integritas SQLite.
- README disederhanakan menjadi tiga dokumen: BACKEND, DEPLOY, REVISI.
- Frontend tetap dapat direvisi tanpa mengunci struktur halaman.

## Berikutnya

- Adapter PostgreSQL runtime untuk seluruh endpoint dan QA parity PostgreSQL.
- Uji deployment HTTPS sungguhan dan restore end-to-end di staging.

## V18

- Menambahkan uji pemulihan backup terisolasi (`restore-drill`), tanpa menimpa database aktif.
- Menambahkan pemeriksaan `.env` production (`deploy-config-check`) tanpa menampilkan nilai secret.
- Menjaga seluruh frontend V15/V17 tetap dapat diedit.
- Belum mengaktifkan PostgreSQL sebagai runtime HTTP; migrasi ke PostgreSQL perlu adapter dan parity test.

## V19 — Backend & pemeriksaan jalur PostgreSQL

- Menambahkan `npm run postgres-parity` untuk membandingkan **jumlah record per tabel** SQLite dan PostgreSQL setelah import. Pemeriksaan bersifat read-only dan gagal jika jumlahnya berbeda.
- Menambahkan `npm run postgres-contract-test` sebagai pemeriksaan offline kelengkapan tabel pada schema PostgreSQL dan daftar tabel yang dicek parity. Tes ini masuk `release-check`.
- Memperjelas prosedur validasi sebelum migrasi dan batasan: pemeriksaan jumlah record **bukan** pengujian kesetaraan data per kolom, operasi CRUD, autentikasi, atau seluruh endpoint.
- Tidak mengubah frontend V15, login animasi, atau struktur modul. Seluruh frontend tetap dapat direvisi mengikuti arahan mentor.
- **Belum selesai:** PostgreSQL belum menjadi runtime HTTP, belum ada QA endpoint PostgreSQL, dan belum ada uji deployment production sungguhan.

## V20 — Integritas paket rilis & gate PostgreSQL staging

- Menambahkan `npm run release-manifest` untuk membuat `release-manifest.json` berisi SHA-256 dan ukuran seluruh file sumber yang akan dirilis (tanpa data runtime, backup, upload, `.env` privat, atau `node_modules`).
- Menambahkan `npm run verify-release` untuk mendeteksi file sumber yang diubah, hilang, atau ditambahkan setelah manifest dibuat. Jalankan pada paket ZIP yang sudah diekstrak **sebelum mengedit frontend**.
- Menambahkan `npm run postgres-live-gate` sebagai pemeriksaan **opsional** untuk lingkungan PostgreSQL staging yang sudah diisi melalui import: menjalankan `postgres-check` dan `postgres-parity`. Memerlukan `psql`, `DATABASE_URL`, dan PostgreSQL yang hidup; tidak dijalankan oleh `release-check` offline.
- Backend HTTP **tetap SQLite**. PostgreSQL runtime penuh dan uji CRUD/auth endpoint pada PostgreSQL belum tersedia; V20 tidak mengklaim sebaliknya.
- Frontend tidak dikunci: jika HTML/CSS/JS diedit setelah rilis, manifest lama wajar tidak cocok; buat manifest baru setelah QA untuk paket revisi berikutnya.
- Hanya tiga README: `README-BACKEND.md`, `README-DEPLOY.md`, `README-REVISI.md`.

## V21 — Validasi kesetaraan isi data PostgreSQL

- Menambahkan `npm run postgres-data-parity` untuk membandingkan **ID dan isi JSON setiap record** pada tujuh tabel data (`monitoring`, `logbook`, `archive`, `users_data`, `disposisi`, `petugas`, `schedules`) antara SQLite dan PostgreSQL staging. Urutan properti JSON dinormalisasi sebelum dihitung SHA-256; perubahan isi maupun record hilang/lebih terdeteksi.
- Menambahkan `npm run postgres-data-parity-test` (offline) untuk menguji normalisasi dan deteksi perbedaan. Test ini ikut `release-check`.
- `npm run postgres-live-gate` kini memeriksa koneksi, jumlah record, dan isi tujuh tabel tersebut. Perintah ini **hanya untuk staging dengan PostgreSQL aktif** dan memerlukan `psql` serta `DATABASE_URL`.
- **Batasan:** belum memeriksa isi seluruh tabel relasional, belum menguji operasi API pada PostgreSQL, dan runtime HTTP tetap SQLite. Jangan melakukan cutover production hanya berdasarkan hasil parity ini.
- Frontend dan animasi login tetap tidak diubah; HTML/CSS/JS bebas direvisi.
- README tetap tiga file: BACKEND, DEPLOY, REVISI.

## V22 — Guard database runtime dan audit kesiapan PostgreSQL

- Menambahkan **fail-closed DB_DRIVER**: jika `DB_DRIVER=postgres` (atau nilai selain `sqlite`), server HTTP berhenti dengan pesan jelas, tidak diam-diam membuka SQLite. Ini mencegah salah persepsi saat deployment.
- Menambahkan `npm run postgres-runtime-readiness` untuk inventaris pemakaian `node:sqlite`, `DatabaseSync`, `db.prepare`, `db.exec`, PRAGMA, dan placeholder SQLite di `server.js`. Gunakan `npm run postgres-runtime-readiness -- --json` untuk melihat lokasi baris.
- Menambahkan self-test pemeriksaan kesiapan PostgreSQL ke `release-check`.
- Memperbaiki audit production agar `.env` lokal yang memang diperlukan deployment **tidak membuat release-check gagal**; audit memeriksa `.gitignore` dan `.dockerignore`. File `.env` tetap tidak dimasukkan dalam ZIP.
- Frontend tidak diubah, masih bisa diedit. Dokumentasi tetap hanya tiga README.
- **Batasan V22:** ini fondasi dan pemetaan kerja adapter, **bukan** PostgreSQL runtime. Tidak ada klaim uji PostgreSQL live atau deployment publik.

## V23 — Audit kompatibilitas query SQL menuju PostgreSQL

- Menambahkan `npm run postgres-sql-audit` untuk memetakan query `db.prepare()` di `server.js` yang memerlukan penyesuaian: placeholder `?`, sintaks `INSERT OR REPLACE/IGNORE`, fungsi SQLite, PRAGMA, dan interpolasi SQL dinamis.
- Menambahkan `npm run postgres-sql-audit -- --json` untuk laporan yang bisa dipakai sebagai daftar pekerjaan adapter.
- Menambahkan `npm run postgres-sql-audit-test` ke `release-check` untuk menguji deteksi SQL bermasalah secara offline.
- Ini **audit statis**, bukan adapter PostgreSQL. Query dinamis, `db.exec`, transaksi, dan perilaku endpoint masih perlu migrasi dan uji terpisah. HTTP runtime tetap SQLite; `DB_DRIVER=postgres` tetap ditolak.
- Frontend tetap dapat diedit; tidak ada perubahan desain maupun modul. Dokumentasi tetap hanya tiga README.

## V24 — Ekstraksi akses database runtime (4 progress)

1. **Modul database terpisah:** inisialisasi SQLite dipindah dari `server.js` ke `backend/database.js`, dengan API `openDatabase()` dan `normalizeDriver()`. Endpoint tetap memakai antarmuka sinkron yang sama.
2. **Guard driver lebih awal:** `DB_DRIVER=postgres` atau nilai tak dikenal ditolak sebelum file SQLite dibuat, untuk mencegah salah konfigurasi deployment.
3. **Pengujian adapter:** `npm run database-adapter-test` memeriksa driver guard, PRAGMA foreign key, dan operasi CRUD SQLite; otomatis ikut `release-check`.
4. **Dokumentasi & rilis:** petunjuk adapter dicatat pada README backend/deploy; frontend HTML/CSS/JS tetap tidak diubah dan editable.

**Batasan:** Ini pemisahan inisialisasi database, **bukan** adapter PostgreSQL. Seluruh pemanggilan `db.prepare()` di endpoint masih sinkron dan menggunakan SQL SQLite. PostgreSQL runtime, QA endpoint PostgreSQL, dan deploy production belum diuji.

## V25 — Ekstraksi repository data payload (4 progress)

1. **Repository terpisah:** operasi baca dan simpan tujuh tabel payload dipindah dari `server.js` ke `backend/payload-repository.js`; kontrak fungsi endpoint tetap sama.
2. **Whitelist tabel:** nama tabel hanya boleh dari daftar eksplisit, sehingga interpolasi identifier SQL tidak menerima tabel sembarang.
3. **Pengujian CRUD:** `npm run payload-repository-test` memeriksa insert, upsert, baca, isolasi tabel, dan penolakan nama tabel berbahaya; otomatis ikut `release-check`.
4. **Frontend & dokumentasi:** HTML/CSS/JS tidak diubah; README tetap hanya tiga.

**Batasan:** repository V25 masih sinkron dan khusus SQLite. Adapter PostgreSQL, kesetaraan API lintas database, dan deployment production belum diuji.

## V26 — Repository session & autentikasi (4 progress)

1. **Repository session:** query penyimpanan `auth_sessions` dipindahkan ke `backend/session-repository.js` agar handler HTTP lebih mudah dipelihara.
2. **Pengelolaan sesi:** pembuatan, pencarian token, expiry, daftar sesi, kepemilikan sesi, pembaruan aktivitas, dan pencabutan sesi kini melalui repository.
3. **Tes otomatis:** `npm run session-repository-test` menguji expiry, isolasi akun, kepemilikan, dan revoke; dimasukkan ke `release-check`.
4. **Frontend & dokumentasi:** HTML/CSS/JS tidak diubah, tetap editable; README tetap hanya tiga.

**Batasan:** query akun/password dan reset password belum dipindahkan. Runtime HTTP masih SQLite; PostgreSQL live dan deployment production belum diuji.

## V27 — Repository akun & reset password (4 progress)

1. **Repository akun:** akses akun untuk login, detail, daftar, tambah, dan ubah akun dipindahkan ke `backend/account-repository.js`.
2. **Reset password:** permintaan, antrean, penyelesaian, dan penggantian hash kata sandi dipusatkan dalam repository, sementara validasi dan otorisasi tetap di HTTP handler.
3. **Pengujian otomatis:** `npm run account-repository-test` memeriksa CRUD akun, lookup, reset request, dan perubahan kata sandi; dijalankan dalam `release-check`.
4. **Frontend & batasan:** HTML/CSS/JS tidak diubah, tiga README tetap dipertahankan. Runtime masih SQLite, PostgreSQL live belum diuji.

**Tahap selanjutnya:** query audit, notulen, storage, dan seed masih memakai SQLite langsung. Pemindahan ke PostgreSQL memerlukan adapter async, transaksi, migrasi schema, serta uji end-to-end dengan server PostgreSQL aktif.

## V28 — Repository audit & storage (4 progress)

1. **Audit repository:** pencatatan dan pencarian audit berfilter, pagination, serta aktivitas akun dipindahkan ke `backend/audit-repository.js`.
2. **Storage repository:** metadata foto notulen (simpan, daftar, penggunaan, hapus) dipindahkan ke `backend/storage-repository.js`. Penulisan file fisik tetap di `server.js`.
3. **Tes otomatis:** `npm run audit-storage-repository-test` memeriksa filter, pagination, audit, serta CRUD metadata storage dan ikut `release-check`.
4. **Frontend & batasan:** HTML/CSS/JS tetap editable dan tidak diubah. Database runtime masih SQLite; PostgreSQL runtime dan deployment publik belum diuji.

## V29 — Repository notulen & persiapan revisi mentor (4 progress)

1. **Repository notulen:** query daftar, detail, bagian, catatan pembicara, dan foto dipindahkan ke `backend/meeting-repository.js`.
2. **Transaksi SQLite:** pembuatan notulen beserta relasinya memakai `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK`; jika gagal, data relasional dibatalkan dan handler membersihkan file upload.
3. **Pengujian:** `npm run meeting-repository-test` menguji relasi dan rollback; ikut `release-check`.
4. **Rencana revisi frontend (BELUM diterapkan):** fitur Notulen direncanakan berubah menjadi tempat pengumpulan hasil notulensi; Beranda menampilkan tim pengguna; jadwal petugas notulen RAKOM kemungkinan dihapus. Menunggu detail final dari pengguna/mentor. HTML/CSS/JS V29 **tidak diubah**, tetap editable.

**Batasan:** runtime masih SQLite; PostgreSQL runtime belum tersedia. Transaksi database tidak mencakup filesystem secara atomik; pembersihan file dilakukan sebagai kompensasi saat error.

## V30 — Validasi notulen & integritas rilis (4 progress)

1. **Modul validasi terpisah:** `backend/meeting-validation.js` memeriksa payload sebelum transaksi database atau penyimpanan foto.
2. **Validasi lebih ketat:** batas panjang topik, jumlah peserta, bagian, catatan, serta bentuk data dokumentasi diperiksa. Alur pengisian notulen lama tetap dipertahankan.
3. **Manifest rilis lebih lengkap:** `release-manifest.json` kini menyertakan kode sumber `backend/`, namun mengecualikan `backend/data` yang berisi data runtime. Perubahan kode repository dapat terdeteksi oleh `npm run verify-release`.
4. **Tes otomatis:** `npm run meeting-validation-test` ditambahkan ke `release-check`; frontend HTML/CSS/JS tidak diubah dan tetap editable.

**Rencana frontend belum diterapkan:** Notulen sebagai tempat pengumpulan hasil notulensi, identitas tim pada Beranda, dan kemungkinan penghapusan jadwal petugas notulen RAKOM masih menunggu rincian revisi. **Batasan:** database runtime tetap SQLite; PostgreSQL live dan deployment production belum diuji.

## V31 — Jalur uji PostgreSQL live (4 progress)

1. **Smoke test PostgreSQL langsung:** `npm run postgres-live-smoke` menguji INSERT, SELECT, UPDATE, DELETE pada PostgreSQL melalui `psql`, memakai transaksi `ROLLBACK` agar data produksi tidak berubah.
2. **Pemeriksaan skema:** tes menghentikan proses jika tabel `monitoring` belum dibuat.
3. **Keamanan konfigurasi:** koneksi menggunakan `DATABASE_URL` dari environment, bukan password yang ditanam dalam kode; proses diberi timeout 30 detik.
4. **Rilis & dokumentasi:** README backend/deploy menjelaskan urutan pemeriksaan PostgreSQL. Frontend tidak diubah.

**Penting:** ini pengujian PostgreSQL live terpisah, **bukan** penggantian runtime API. `server.js` masih SQLite. Pengujian live hanya dapat diklaim lulus setelah dijalankan dengan database PostgreSQL yang tersedia. Belum ada server hosting/VPS untuk deployment publik.

## V32 — Adapter PostgreSQL untuk data payload (tahap pertama)
1. Menambah `backend/postgres-payload-repository.js` untuk operasi list/get/create/update/delete pada 7 tabel data berbasis JSONB.
2. Menggunakan parameter SQL `$1`, `$2` dan whitelist tabel untuk menghindari penyisipan SQL pada nama tabel.
3. Menambah `postgres-payload-adapter-test` dan memasukkannya ke `release-check`.
4. Frontend tidak diubah; tiga README dipertahankan.

**Batasan penting:** adapter ini **belum dipasang ke `server.js`**. Login, session, notulen, dan API HTTP tetap memakai SQLite. `DB_DRIVER=postgres` tetap ditolak oleh runtime agar tidak memberi kesan palsu. Untuk memakai adapter ini dalam HTTP runtime diperlukan refaktor async dan dependensi PostgreSQL `pg`, diikuti pengujian dengan server PostgreSQL yang benar-benar berjalan. Tidak ada klaim production-ready.

## V33 — PostgreSQL account repository (4 progress)
1. Menambahkan `backend/postgres-account-repository.js` untuk query akun async (pencarian username/id, daftar akun).
2. Menambahkan perubahan password hash dan status akun melalui query parameter `$1`–`$3`, tanpa interpolasi input ke SQL.
3. Menambahkan `npm run postgres-account-adapter-test` ke `release-check` untuk menguji kontrak query dan validasi status.
4. Frontend tidak diubah dan tetap editable; README tetap tiga.

**Batasan:** V33 menambah komponen PostgreSQL tetapi **belum menyambungkan login atau API server ke PostgreSQL**. Runtime tetap SQLite; jangan set `DB_DRIVER=postgres` pada `npm start`. Tes adapter menggunakan mock client, bukan database PostgreSQL live.

## V34 — PostgreSQL session repository (4 progress)
1. Menambah `backend/postgres-session-repository.js` untuk penyimpanan dan pencarian sesi berbasis query PostgreSQL async.
2. Menambah operasi revoke, touch, daftar sesi aktif, dan validasi kepemilikan sesi dengan parameter `$1` dan seterusnya.
3. Menambah `postgres-session-adapter-test` ke `release-check` untuk memeriksa kontrak parameter SQL dan operasi sesi.
4. Frontend tetap editable, tidak diubah; README tetap tiga.

**Batasan:** adapter ini belum dihubungkan ke HTTP server. Login website masih menggunakan SQLite; pengujian PostgreSQL session adapter menggunakan mock query, bukan server PostgreSQL live. Jangan ubah `DB_DRIVER` ke `postgres` untuk `npm start`.

## V35 — PostgreSQL Audit & Storage Adapter
1. Repository PostgreSQL untuk menulis dan membaca audit log dengan filter serta pagination terbatas.
2. Repository PostgreSQL untuk metadata file upload (simpan, daftar, hapus); file fisik tetap di volume upload.
3. Self-test parameter SQL, validasi ukuran file, dan pembatasan pagination dimasukkan ke `release-check`.
4. Frontend tidak diubah dan tetap editable. **API HTTP dan login masih menggunakan SQLite; PostgreSQL runtime belum aktif.**

## V36 — PostgreSQL HTTP read-only preview (14 Oktober 2026)
1. Endpoint `GET /api/postgres-preview/:resource` membaca data langsung dari PostgreSQL melalui driver `pg` untuk tujuh modul payload, dengan `limit` maksimal 100.
2. Endpoint tetap membutuhkan login dan izin modul yang berlaku. Mode ini **hybrid**: login/session dan API utama tetap SQLite; preview tidak mengubah data PostgreSQL.
3. `PG_READ_PREVIEW=1` dan `DATABASE_URL` mengaktifkan preview. Tanpa flag, endpoint tidak tersedia. Jika PostgreSQL gagal, respons error (tidak diam-diam mengambil data SQLite).
4. Tes gateway PostgreSQL berbasis mock masuk `release-check`. **Belum diuji ke PostgreSQL laptop pengguna**, belum full PostgreSQL runtime dan belum production deployment. Frontend tidak diubah.

## V37 — PostgreSQL HTTP preview pagination dan detail
1. Endpoint preview PostgreSQL mendukung pagination `?page=1&limit=25`, termasuk total data dan jumlah halaman dari PostgreSQL.
2. Endpoint preview mendukung baca satu data berdasarkan ID: `GET /api/postgres-preview/monitoring/:id` (404 jika tidak ditemukan).
3. Parameter pagination dan ID divalidasi; query memakai parameter `$1`, `$2`, dan whitelist tabel. Tes gateway V37 memeriksa list, detail, count, dan input tidak valid.
4. Frontend tetap tidak berubah dan editable. README tetap tiga.

**Batasan:** endpoint ini tetap preview read-only yang menggunakan login/session SQLite. API utama belum PostgreSQL runtime. Pengujian otomatis memakai mock pool; PostgreSQL live pengguna belum diuji.

## V38 — Pemeriksaan parity HTTP PostgreSQL
1. Endpoint GET `/api/postgres-preview-parity` khusus Superadmin, login tetap melalui SQLite.
2. Membandingkan jumlah baris tujuh modul di SQLite dan PostgreSQL, tanpa menulis data.
3. Hasil mencakup match, selisih per modul, dan waktu pemeriksaan.
4. Tes otomatis parity ditambahkan ke release-check; frontend tidak diubah.

Status: mode hybrid, belum PostgreSQL sebagai database utama.

## V39 — PostgreSQL HTTP write gateway (14 Oktober 2026)
1. Endpoint `/api/postgres-write/:resource` mendukung POST, PUT/PATCH, DELETE untuk tujuh tabel JSONB PostgreSQL.
2. Hanya Superadmin yang sudah login; aktif hanya bila `PG_READ_PREVIEW=1` dan `PG_WRITE_PREVIEW=1`.
3. Query menggunakan parameter SQL dan whitelist tabel; perubahan tercatat pada audit SQLite. Tes kontrak ditambahkan.
4. Frontend tetap editable dan tidak diubah. **Ini belum menggantikan login/session/API utama SQLite**, dan belum diuji live di PostgreSQL pengguna.

## V40 — Revisi pengumpulan notulensi dan beranda
- Halaman Buat Notulen diganti formulir pengumpulan dokumen rapat PDF/DOC/DOCX maksimal 6 MB, terbuka untuk seluruh akun aktif termasuk Pegawai.
- Endpoint terautentikasi untuk unggah, daftar, dan unduh dokumen; metadata di SQLite, file di uploads/notulen.
- Beranda menampilkan unit kerja akun dari kolom `accounts.unit`; jika tim spesifik berbeda dari unit, perlu pemetaan data akun pada revisi selanjutnya.
- Jadwal petugas RAKOM belum dihapus karena keputusan pengguna masih tentatif.
- PostgreSQL runtime utama belum terintegrasi; API utama masih SQLite.


## V41 (revisi dari V40) — Pengumpulan notulensi tanpa tim kerja
- Kolom **Tim Kerja** dihapus dari formulir pengumpulan hasil notulensi.
- Daftar hasil pengumpulan tidak lagi menampilkan tim kerja atau placeholder tim.
- API unggah mengabaikan atribut tim untuk pengumpulan baru; kolom lama dipertahankan agar dokumen sebelumnya tidak rusak.
- Semua pegawai tetap dapat mengunggah hasil rapat; tampilan unit kerja di Beranda tetap ada.
- Ditambahkan tes regresi `npm run notulen-no-team-test`.
- Paket distribusi mengecualikan database SQLite lokal, WAL/SHM, dan dokumen unggahan; jangan gunakan versi ini sebagai bukti keamanan produksi.

## V42 — Penguatan keamanan sebelum akses publik (15 Oktober 2026)
1. Startup production fail-closed: `SESSION_SECRET` minimal 32 byte; tidak membuat akun demo otomatis; menolak akun dengan password bawaan `Ditrenduk2026!`.
2. Startup production SQLite diblokir secara default; override eksplisit `ALLOW_SQLITE_PUBLIC=I_UNDERSTAND_THE_RISK` hanya untuk lingkungan yang sudah diaudit, memakai volume persisten, backup teruji, dan disetujui instansi. **Override bukan sertifikasi aman**.
3. Static server hanya melayani direktori asset yang diizinkan, menolak `/uploads`, `/scripts`, `/postgres`, `/migrations`, `/backups` serta file internal; file dengan ekstensi tak dikenal tidak disajikan.
4. JSON tidak valid kini mengembalikan HTTP 400; payload di atas batas mengembalikan HTTP 413; ID request dibuat server sendiri.
5. Tes keamanan HTTP baru `npm run security-v42-test` menguji penolakan akses internal, JSON rusak dan batas payload; digabung ke `release-check`.
6. Perbaikan notulensi V41 dipertahankan: tidak ada kolom Tim Kerja dalam formulir/daftar pengumpulan; Beranda tetap menampilkan unit kerja.

**Belum selesai:** runtime PostgreSQL utama (login/session/API), audit independen/pentest, penyimpanan dokumen cloud persisten, backup+restore produksi, persetujuan keamanan instansi. **Jangan buka ke publik dengan data instansi asli.**

## V43 — pengamanan unggahan dan origin
- Pengumpulan notulensi: batas 20 unggahan per akun per 15 menit, pemeriksaan tanggal kalender, nama file/ekstensi, dan signature PDF/DOC/DOCX.
- Origin development localhost tidak lagi diizinkan sebagai pengecualian pada production. Cookie logout memakai Secure saat production.
- Runtime HTTP tetap SQLite; PostgreSQL utama, backup dan audit keamanan independen belum selesai. Jangan gunakan data instansi asli pada hosting publik.

## V44 — Penyimpanan lampiran terpisah dan fail-closed
- `NOTULEN_UPLOAD_DIR` mendukung folder absolut di luar source aplikasi untuk volume persisten; mode development tetap memakai `uploads/notulen`.
- Production menolak startup tanpa folder unggahan eksternal dan `CONFIRM_PERSISTENT_UPLOAD_STORAGE=YES`; flag hanya pernyataan operator, **bukan** verifikasi otomatis volume persisten.
- Menolak symlink folder unggahan; file baru dibuat dengan mode 0600 dan unduhan menolak path yang bukan file reguler.
- Menambah tes regresi `security-v44-test` dalam `release-check`.
- **Belum siap produksi:** SQLite masih database utama, PostgreSQL runtime belum selesai, belum ada backup/restore produksi atau audit independen. Jangan expose data instansi asli.

## V45 — PostgreSQL sebagai sumber data utama untuk tujuh modul (hybrid development)
- `PG_PRIMARY_PAYLOAD=1` mengalihkan API utama monitoring, logbook, arsip, pengguna-data, disposisi, petugas, dan jadwal ke PostgreSQL untuk operasi daftar/detail, tambah, ubah, dan hapus; bootstrap, dashboard, dan ekspor CSV juga mengikuti PostgreSQL.
- Membutuhkan `PG_READ_PREVIEW=1`, `DATABASE_URL`, dan skema PostgreSQL yang sudah dibuat. Mode ini **tidak** memindahkan akun, login, sesi, audit, notulensi, atau metadata unggahan: komponen tersebut tetap SQLite.
- Startup `NODE_ENV=production` sengaja menolak mode hybrid. Ini bukan PostgreSQL runtime penuh atau rilis layak publik dengan data asli.
- Menambah tes kontrak routing `postgres-primary-routing-test`; pengujian memakai mock, bukan koneksi PostgreSQL 18 milik pengguna.


## V46 — Perbaikan skema dan migrasi PostgreSQL notulensi
- Skema PostgreSQL sekarang mencakup `notulen_submissions`, sebelumnya belum ada walaupun SQLite memakainya.
- Migrasi tambahan aman dijalankan pada database PostgreSQL yang sudah dibuat (`npm run postgres-notulen-migrate`).
- Import SQLite ke PostgreSQL mencakup `notulen_submissions` dan `auth_sessions` (file unggahan fisik harus dimigrasikan terpisah).
- Pengujian kontrak V46 masuk release-check. Belum integrasi login/session/notulen ke PostgreSQL HTTP runtime.

## V47 — Pemeriksaan runtime PostgreSQL nyata
- Menambahkan `npm run postgres-runtime-gate` yang benar-benar terhubung ke PostgreSQL via `pg`, memeriksa 12 tabel inti, menghitung data dan hak baca tanpa mengubah data.
- Menambahkan tes otomatis `postgres-runtime-gate-test` dan memasukkannya ke `release-check`.
- Menambahkan dukungan `PGPASSWORD` untuk pemeriksaan driver Node.js tanpa menuliskan password ke source.
- Batasan: pemeriksaan ini bukan migrasi runtime HTTP. Login/session/notulensi masih SQLite; **belum siap dipublikasi dengan data instansi**.

## V48 — PostgreSQL live CRUD validation
- Gateway PostgreSQL kini mendukung PGPASSWORD untuk driver pg (sebelumnya hanya script CLI).
- Menambah `npm run postgres-primary-live-crud`: uji create/read/update/list/delete di tujuh tabel PostgreSQL nyata dalam satu transaksi yang selalu ROLLBACK.
- Tes ini harus dijalankan pada PostgreSQL 18 pengguna; tidak dijalankan pada database lokal asisten.
- **Belum PostgreSQL runtime penuh**: login, sesi, audit, dan notulensi masih SQLite; jangan deploy untuk data resmi.

## V49 — PostgreSQL Auth/Session Live Transaction Test
- Tambah `npm run postgres-auth-live-smoke`: uji PostgreSQL sungguhan untuk lookup akun, rotasi hash password, pembuatan, pemeriksaan, sentuhan, kepemilikan dan pencabutan session.
- Semua data pengujian menggunakan ID acak dalam transaksi `BEGIN`/`ROLLBACK`; akun dan sesi uji tidak ditinggalkan.
- Perintah uji memerlukan `DATABASE_URL`, `PGPASSWORD`, database PostgreSQL yang sudah dimigrasi, dan driver `pg` terpasang.
- Pengujian ini **bukan** pemindahan runtime HTTP: login/session website masih SQLite. Belum layak deployment publik dengan data instansi.

## V50 — PostgreSQL Auth HTTP (development-only)
- Login HTTP, `/api/auth/me`, dan logout memakai akun/sesi PostgreSQL jika `PG_PRIMARY_AUTH=1` dan `PG_READ_PREVIEW=1`.
- Endpoint lain diblokir (503) pada mode ini agar tidak mencampur otorisasi PostgreSQL dengan SQLite.
- Production menolak mode parsial; belum siap digunakan publik.
- Tes routing baru dimasukkan dalam release-check.

## V51 — PostgreSQL auth self-service (development only)
- Mode `PG_PRIMARY_AUTH=1` kini menghubungkan HTTP `POST /api/auth/change-password`, `GET /api/auth/sessions`, dan `DELETE /api/auth/sessions/:id` ke repository PostgreSQL.
- Pemeriksaan sesi dan kepemilikan dilakukan melalui PostgreSQL, bukan SQLite. Perubahan password mencabut sesi lain.
- Tes kontrak `postgres-auth-selfservice-test` ditambahkan ke `release-check`.
- **Batasan:** mode ini tetap development-only; API modul lain tetap dinonaktifkan dalam mode PG_PRIMARY_AUTH. Belum siap deployment publik, belum diverifikasi ke PostgreSQL 18 pengguna.

## V52 — Persiapan deployment URL
- Memperbaiki mount folder unggah notulensi Docker production ke volume persisten di luar source, sesuai startup guard V44.
- Menambahkan perintah `public-url-smoke` untuk memverifikasi homepage, `/api/health`, dan `/api/ready` pada URL HTTPS setelah deployment.
- Menambahkan `deployment-kit-test` ke `release-check`. Belum menerbitkan URL publik dan belum mengaktifkan PostgreSQL sebagai runtime production.

## V53 — Agenda Kegiatan & Task Deadline
- Jadwal Petugas RAKOM diganti Agenda Kegiatan dan ditambah Task Deadline dari Excel 2026.
- Kedua menu hanya terlihat untuk akun berizin; API CRUD memverifikasi izin setiap request.
- Superadmin mengatur izin melalui Pengguna.
- Data Excel diimpor sekali ke tabel SQLite baru; jangan jadikan seed JSON sebagai file publik.
- Belum siap production/PostgreSQL penuh; URL operasional memerlukan hosting dan migrasi.


## V54 — Perbaikan identitas, izin workspace, notifikasi reset
- Nama beranda mengikuti akun aktif dari `/api/auth/me`, bukan Femilia statis. Header mengikuti akun login.
- Sidebar, pencarian global, dan halaman dibatasi berdasarkan permissions akun; Superadmin dapat melihat seluruh modul. API tetap menerapkan kontrol akses.
- Lonceng notifikasi Superadmin mengambil permintaan reset berstatus Menunggu langsung dari server (refresh setiap 30 detik dan saat tab aktif). Nama dan username pemohon ditampilkan; detail ada di Pengguna > Permintaan reset kata sandi.
- Permintaan reset hanya boleh ditinjau/diselesaikan Superadmin. Kata sandi sementara tidak lagi diisi default di UI.
- Masih diperlukan uji multi-akun di browser dan migrasi PostgreSQL penuh sebelum deployment operasional.


## V55 — Perbaikan gagal permintaan lupa kata sandi
- Penyebab: tabel `password_reset_requests` hanya tersedia setelah migrasi manual, sedangkan `npm start` tidak menerapkan migrasi tersebut.
- Server kini menerapkan skema reset secara idempoten saat startup sebelum melayani HTTP. Data akun dan permintaan lama tidak dihapus.
- Tes regresi memastikan tabel dibuat saat startup. Restart server setelah memperbarui paket.


## V56 — reset password UI dan notifikasi
- Mengganti prompt browser pada permintaan reset menjadi modal berdesain aplikasi dengan validasi password.
- Header tidak lagi memuat identitas Femilia/Notulis secara statis; identitas dan peran mengikuti sesi login.
- Memperkuat pengecekan peran Superadmin untuk notifikasi dan akses menu; refresh notifikasi setelah reset diproses.

### V57 — perbaikan akar masalah identitas dan notifikasi
- `js/api.js` kini mengekspor `window.API = API`. Sebelumnya `const API` hanya tersedia sebagai global lexical binding, sementara `js/layout.js` memeriksa `window.API`, sehingga pemuatan sesi `/api/auth/me` dilewati, nama akun menjadi placeholder, dan notifikasi Superadmin tidak pernah diambil.
- Tes regresi `npm run frontend-api-global-test` memverifikasi ekspor API. Setelah update, restart server dan hard refresh browser.


V58: Notifikasi reset Superadmin kini menggunakan endpoint /api/password-reset-requests yang sama dengan tabel Pengguna, memfilter status Menunggu, dan mematikan cache. Pemeriksaan role menu Pengguna dibuat case-insensitive. Uji akun aktual tetap diperlukan.

## V59 — Fail-closed session dan data workspace
Workspace sekarang menolak akses bila API/session gagal dimuat, identitas akun tidak lengkap, atau bootstrap data backend gagal. Tidak lagi diam-diam menampilkan data frontend yang bisa menyesatkan pengguna. Tes: `npm run frontend-auth-failclosed-test`. Perubahan ini bukan pengganti integrasi PostgreSQL penuh atau hosting production.
\n\n## V60 — Pemeriksaan kelayakan operasional\n\n`npm run production-readiness-gate` memeriksa prasyarat produksi dan **sengaja gagal** selama seluruh HTTP runtime belum menggunakan PostgreSQL. `npm run production-readiness-gate-test` memverifikasi perilaku fail-closed. Gate bukan bukti deployment, dan tidak mengaktifkan URL publik.\n

## V61 — Agenda Kegiatan dan Task Deadline
- Tanggal agenda dan deadline menggunakan pemilih tanggal browser (`type=date`), dengan batas minimum 1 Januari 2026 tanpa batas tahun maksimum.
- Asal Surat memakai input yang dapat diketik serta datalist saran dari entri asal surat yang tersedia pada data impor Excel.
- Aksi Edit dan Hapus diberi jarak agar lebih mudah diklik.
- Tidak mengubah database atau data akun.

## V62 — Dropdown Asal Surat
- Dropdown native datalist diganti combobox berwarna putih sesuai tema E-DITRENDUK, dengan jarak item, ukuran teks, hover, pencarian, keyboard, dan opsi nama baru.
- Jarak label dan field dalam modal Agenda Kegiatan dan Task Deadline diperlebar.

## V63 — Pemilih jam dan status Task Deadline
- Agenda Kegiatan: pilih jam mulai dan selesai melalui input time bawaan browser; otomatis mengisi teks waktu, dengan input manual tetap tersedia untuk jadwal fleksibel.
- Task Deadline: status dipilih lewat dropdown Done/Not yet dan ditampilkan sebagai badge hijau/merah.

## V64 — Status Task Deadline langsung dari tabel
- Badge status pada daftar Task Deadline sekarang dropdown interaktif (Done hijau, Not yet merah) tanpa harus membuka Edit.
- Perubahan status disimpan melalui API PATCH dengan pemeriksaan izin server; status dikembalikan jika penyimpanan gagal.
- Fitur edit dan hapus tetap tersedia; tanggal dan jam Agenda Kegiatan dipertahankan.

## V65 — Integrasi PostgreSQL Agenda dan Task Deadline (development)
- Endpoint HTTP Agenda Kegiatan dan Task Deadline mendukung repository PostgreSQL melalui PG_READ_PREVIEW=1 dan PG_PRIMARY_AGENDA_TASK=1 (development saja).
- SQL `postgres/migrations/v65-agenda-task.sql` membuat tabel PostgreSQL secara idempoten.
- `npm run postgres-agenda-task-migrate` menjalankan migrasi melalui psql.
- `npm run postgres-agenda-task-import` menyalin data dari SQLite lama secara non-destruktif (konflik tidak ditimpa). Wajib backup dan CONFIRM_AGENDA_TASK_IMPORT=YES.
- Validasi server memastikan status Task Deadline hanya `done` / `not yet`, dan menolak tanggal kalender yang tidak valid.
- Pengujian HTTP asli: login, CRUD Task, perubahan status parsial, validasi, dan logout.
- **Belum untuk production:** autentikasi, audit, dan modul lain masih hybrid/SQLite. Mode ini sengaja diblokir di production.

## V66 — Migrasi Agenda/Task lebih aman dan dapat diverifikasi
- `npm run postgres-agenda-task-import` sekarang hanya **dry-run** (tidak menulis).
- Sumber SQLite default `backend/data/editrenduk.sqlite`, atau path absolut `SQLITE_SOURCE_PATH` untuk database lama.
- Impor nyata wajib `CONFIRM_AGENDA_TASK_IMPORT=YES npm run postgres-agenda-task-import -- --apply` setelah backup.
- Sebelum impor, validasi seluruh JSON, ID, tabel PostgreSQL dan jumlah sumber.
- Sesudah impor, verifikasi keberadaan semua ID sumber dalam transaksi; bila gagal lakukan ROLLBACK.
- Konflik ID dilewati, data PostgreSQL yang sudah ada tidak ditimpa.
- Ditambahkan pengujian jalur file dan pengaman impor.
- Tetap development-only, bukan deployment produksi atau PostgreSQL penuh.

## V67 — Alur lupa kata sandi PostgreSQL (development)
- Mode PG_PRIMARY_AUTH=1 mendukung POST /api/auth/forgot-password dengan respons generik tanpa membocorkan akun.
- Superadmin PostgreSQL dapat membaca /api/admin/reset-notifications dan /api/password-reset-requests, serta menyelesaikan permintaan melalui POST /api/password-reset-requests/:id/resolve.
- Reset password, pencabutan sesi dan penandaan permintaan selesai berlangsung dalam satu transaksi PostgreSQL.
- Migrasi idempoten `npm run postgres-reset-migrate`; pengujian mock repository tersedia.
- Mode ini tetap khusus development: modul lain masih diblokir saat PG_PRIMARY_AUTH aktif, belum layak production.

## V68 — Migrasi aman akun dan permintaan reset ke PostgreSQL
- `npm run postgres-auth-import`: dry-run secara default; membaca akun, hash password (tanpa menampilkannya), role, permissions, dan permintaan reset dari SQLite.
- `CONFIRM_AUTH_IMPORT=YES` mengaktifkan impor atomik setelah backup; akun PostgreSQL yang sudah ada tidak ditimpa (`ON CONFLICT DO NOTHING`).
- Konflik username/email berbeda ID menghentikan migrasi, bukan menyatukan dua akun berbeda.
- SQL V67 password reset disertakan pada `postgres/schema.sql` untuk instalasi baru.
- Readiness endpoint kini memeriksa PostgreSQL pada mode PG_PRIMARY_AUTH dan PG_PRIMARY_AGENDA_TASK.
- **Belum production-ready:** PG_PRIMARY_AUTH masih membatasi API modul lain; data akun sensitif wajib diimpor hanya ke database resmi yang disetujui instansi.

## V69 — Verifikasi kesesuaian data akun setelah migrasi PostgreSQL
- `npm run postgres-auth-parity` membandingkan SQLite sumber dengan PostgreSQL secara read-only.
- Memeriksa username, identitas akun, role, status, unit, hak akses menu, kecocokan hash password, kewajiban ganti password, dan permintaan reset.
- Tidak mencetak nama, email, password atau hash; laporan hanya ID dan jenis perbedaan.
- Mengembalikan exit code 2 bila ada perbedaan, agar pemindahan akun tidak dianggap selesai sebelum data sesuai.
- PostgreSQL mode autentikasi masih terpisah dari modul lain; ini bukan kesiapan deployment production.

## V70 — Satu sesi PostgreSQL untuk Agenda dan Task Deadline (development)
- Aktifkan `PG_READ_PREVIEW=1`, `PG_PRIMARY_AUTH=1`, dan `PG_PRIMARY_AGENDA_TASK=1` secara bersamaan dengan DATABASE_URL.
- Login dan sesi diverifikasi melalui PostgreSQL, bukan SQLite, untuk GET/POST/PATCH/PUT/DELETE Agenda dan Task.
- Izin modul diperiksa dari role dan permissions PostgreSQL. Pegawai tanpa izin mendapat HTTP 403.
- Status parsial Task tetap mempertahankan isi tugas, validasi tanggal dan status dijalankan di backend.
- API lainnya tetap 503 dalam mode ini agar tidak memakai identitas SQLite secara diam-diam.
- **Belum untuk production**: audit PostgreSQL dan semua modul lainnya belum disatukan.

## V71 — Penyatuan 7 modul PostgreSQL dalam sesi pegawai
- Dengan PG_READ_PREVIEW=1, PG_PRIMARY_AUTH=1, PG_PRIMARY_PAYLOAD=1 dan PG_PRIMARY_AGENDA_TASK=1, tujuh modul (monitoring, logbook, arsip, users, disposisi, petugas, schedules) menggunakan sesi PostgreSQL yang sama dengan Agenda dan Task Deadline.
- Endpoint `/api/bootstrap`, `/api/dashboard`, `/api/audit` ikut tersedia pada mode gabungan; bootstrap tidak mengirim data modul tanpa izin.
- Operasi CREATE/UPDATE/DELETE modul yang baru terintegrasi dan Agenda/Task mencatat audit di PostgreSQL, bukan SQLite.
- Pengujian kontrak akses dan CRUD PostgreSQL dengan mock; **belum diuji terhadap PostgreSQL live**.
- Notulensi, administrasi akun penuh, dan unggahan dokumen masih memerlukan integrasi; mode PostgreSQL hybrid tetap DILARANG untuk production.

## V72 — Supabase Storage privat untuk lampiran Notulensi
- Opsi `NOTULEN_STORAGE_PROVIDER=supabase` menyimpan lampiran PDF/DOC/DOCX ke Supabase Storage melalui backend, tanpa mengekspos service-role key ke browser.
- Bucket `notulen-private` wajib **private**, dibuat dan dikonfigurasi oleh admin proyek Supabase.
- File diunduh melalui endpoint backend terautentikasi; tidak menggunakan public URL.
- Backend masih membatasi ukuran file 6 MB; kapasitas penyimpanan total tergantung kuota dan paket Supabase, bukan tanpa batas.
- Konfigurasi: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET (opsional), NOTULEN_STORAGE_PROVIDER=supabase.
- Data metadata Notulensi masih memakai SQLite pada jalur lama. **Jangan aktifkan PG_PRIMARY_AUTH untuk menguji Notulensi**: jalur itu masih membatasi endpoint. Penggabungan metadata PostgreSQL belum selesai.
- Untuk production instansi: perlu persetujuan pengelola data, lokasi penyimpanan yang sesuai, kebijakan retensi, backup, dan kontrol akses; service-role key hanya di environment server.

## V73 — Notulensi PostgreSQL + Supabase Storage privat
- `GET/POST /api/notulen-submissions` dan download lampiran memakai identitas PostgreSQL jika `PG_PRIMARY_AUTH=1`.
- Metadata notulensi tersimpan di PostgreSQL, dokumen di Supabase Storage privat; tidak fallback ke SQLite.
- Validasi tanggal, format PDF/DOC/DOCX, signature file, ukuran maksimal 6 MB, nama file dan rate limit.
- Download memakai backend terautentikasi, no-store, nosniff.
- Gagal menyimpan metadata akan menghapus objek unggahan untuk menghindari file yatim.
- Mode hybrid tetap development-only dan diblokir untuk production. Belum tersedia URL HTTPS atau deployment instansi.

## V74 — Penguatan origin, CSRF dan kesiapan hosting
- Request yang mengubah data di production wajib berasal dari APP_ORIGIN HTTPS yang persis sama. Header Host tidak dipakai sebagai sumber kepercayaan.
- Origin hilang, subdomain lain, dan permintaan cross-site ditolak.
- CSP production tidak lagi mengizinkan koneksi localhost.
- `npm run hosting-preflight` memeriksa konfigurasi deployment tanpa mencetak kredensial.
- `npm run request-security-test` dan `npm run hosting-preflight-test` memverifikasi aturan.
- **Tidak menghapus production safety gate.** Belum ada URL aktif dan belum ada klaim production ready.

## V75 — Hardening akses file publik dan data demo production
- Static assets sekarang menggunakan allowlist halaman dan tipe file; file internal, `js/api.js.tmp`, file backup, `.env`, database, dan symlink keluar root ditolak.
- Permintaan path traversal atau URL-encoded traversal ditolak, termasuk ketika path mengarah ke file yang ada.
- HTTP `HEAD` tidak lagi mengirimkan isi file.
- Saat `NODE_ENV=production`, data contoh dari Excel (termasuk Agenda/Task) tidak di-seed otomatis ke database kosong. Data produksi harus dimigrasikan dan diverifikasi secara sengaja.
- `npm run static-file-policy-test` memeriksa traversal, dotfile, file sementara, symlink dan asset yang diizinkan.
- Mode PostgreSQL hybrid masih diblokir di production; V75 belum dapat dipublikasikan sebagai website operasional.

## V76 — Penguatan otorisasi direktori pengguna PostgreSQL
- Endpoint `/api/users` dan data `users` pada bootstrap dibatasi hanya untuk Superadmin aktif.
- Operasi POST/PATCH/PUT/DELETE ke `/api/users` ditolak untuk semua role, termasuk Superadmin; pengubahan identitas dan izin tidak boleh memakai CRUD payload generik.
- Regression test memastikan pegawai, Admin, dan akun nonaktif tidak dapat membaca direktori pengguna, serta audit tetap khusus Superadmin.
- Pengelolaan akun PostgreSQL khusus melalui endpoint admin yang tervalidasi masih menjadi pekerjaan lanjutan.

## V77 — Superadmin PostgreSQL CRUD akun
- Endpoint `/api/accounts` GET/POST/PATCH/PUT dan `/api/accounts/:id/reset-password` memakai satu sesi PostgreSQL dalam mode PG_PRIMARY_AUTH.
- Mutasi transaksional, audit PostgreSQL, sesi dicabut saat role/status/izin/password berubah.
- Menolak perubahan terhadap Superadmin aktif terakhir, role/status tak dikenal, dan konflik username/email.
- Mode development; production gate tetap aktif hingga seluruh runtime dan deployment selesai.

## V78 — Paket besar keamanan operasional dan kesiapan hosting
- Backup PostgreSQL terenkripsi AES-256-GCM streaming (`npm run pg-backup-secure`), passphrase tidak disimpan di ZIP; plaintext tidak ditulis ke disk.
- Pemeriksaan autentikasi enkripsi dan struktur arsip PostgreSQL (`npm run pg-backup-inspect -- /path/file.pgbak.enc`) tanpa melakukan restore.
- Smoke keamanan URL publik (`npm run public-security-smoke -- https://alamat-resmi`) untuk API privat dan file backend/konfigurasi.
- Panduan operator lengkap di `docs/OPERASIONAL-HOSTING.md`: deployment, variabel lingkungan, backup, restore drill, storage, hak akses dan pengujian staging.
- Test regresi keamanan operasional baru ditambahkan ke `release-check`.
- **Penting:** backup ini hanya PostgreSQL, bukan file Supabase; restore harus diuji terpisah. Production-readiness gate masih BLOCK sampai seluruh API diverifikasi siap produksi.

## V79 — Backup dokumen Supabase Storage privat
- Backup terenkripsi per objek menggunakan AES-256-GCM.
- Inventaris manifest nama file, ukuran dan SHA-256.
- Verifikasi checksum dan deteksi perubahan file backup.
- Tes simulasi end-to-end; belum diuji ke Supabase produksi.
- Batasan: object key flat .pdf/.doc/.docx, tanpa restore otomatis.

## V80 — Pemulihan dokumen aman ke staging
- Restore dokumen Supabase terenkripsi dengan dry-run sebagai default.
- Membatasi bucket tujuan ke bucket staging/test/sandbox yang berbeda dari sumber.
- Memerlukan `RESTORE_CONFIRM` eksplisit dan menolak `NODE_ENV=production`.
- Memeriksa checksum dan menolak overwrite objek existing.
- Pengujian regresi V80 terintegrasi ke `release-check`.
- Catatan: restore belum diuji pada layanan Supabase nyata; proses tidak transaksional.

## V81 — Backup restore integrity hardening
- Manifest strict: duplicate file/nama, ukuran, checksum, traversal dan symlink ditolak.
- Sebelum restore, seluruh dokumen didekripsi dan diverifikasi sebelum unggah pertama untuk menghindari pemulihan parsial karena backup rusak.
- Tes regresi keamanan tambahan. Masih perlu uji staging nyata dan restore transaksi tidak dijamin bila upload gagal di tengah.

## V82 — Staging collision preflight dan audit kesiapan produksi
- Restore memeriksa konflik nama file tujuan sebelum mulai upload.
- Tes memastikan konflik menggagalkan restore sebelum ada file diunggah.
- `npm run release-status` menampilkan readiness gate dan hal yang belum diuji secara jujur.
- Belum menghapus blocker PostgreSQL production.

## V83 — Audit migrasi runtime PostgreSQL
- Inventaris penggunaan SQLite/legacy dan jalur PostgreSQL di server.js.
- Tes otomatis agar penghambat produksi tidak disembunyikan oleh hasil uji simulasi.
- Roadmap teknis di `docs/V83-ROADMAP-MIGRASI-POSTGRESQL.md`.
- Belum mengklaim full PostgreSQL atau URL publik aktif.

## V84 — Lampiran Surat di Agenda
- Tombol lampiran di setiap agenda, modal daftar dokumen, unggah dengan jenis surat, lihat dan hapus.
- Maksimal 5 dokumen per agenda; masing-masing maksimal 5 MB, PDF/DOCX/JPG/PNG.
- Endpoint privat `/api/agenda/:id/attachments` dan `/api/agenda/:id/attachments/:attachmentId/file`.
- Metadata lampiran disimpan bersama payload agenda, file disimpan dalam bucket privat Supabase (`AGENDA_STORAGE_BUCKET=agenda-private`).
- Perlu konfigurasi bucket baru privat; belum ada migrasi otomatis dokumen dan belum diuji dengan Supabase live.
- Batasan: update lampiran belum memakai locking transaksi, sehingga unggahan bersamaan perlu diuji lebih lanjut sebelum produksi.

## V85 — Siklus hidup lampiran Agenda
- Memperbaiki bug penting: mengedit detail agenda tidak lagi menghapus metadata lampiran.
- Ketika agenda dihapus, file lampiran privat diupayakan ikut dihapus dari Supabase Storage.
- Kegagalan pembersihan file dicatat di log tanpa membocorkan kredensial; perlu prosedur rekonsiliasi file yatim.
- Pengujian regresi memastikan jalur edit dan hapus memuat logika pengelolaan lampiran.
- Belum ada transaksi atomik lintas database/storage; uji staging tetap wajib.

## V86 — PostgreSQL Agenda attachment integrity
- Perbaikan PUT/PATCH Agenda pada PostgreSQL agar metadata lampiran tetap tersimpan dan tidak dapat dihapus dengan payload client.
- Tes regresi khusus PostgreSQL.
- Masih perlu transaksi/locking lintas instance, cleanup lampiran ketika agenda dihapus lewat PostgreSQL, dan uji staging Supabase langsung.

## V87 — Serialisasi Lampiran Agenda
- Operasi lampiran untuk agenda yang sama diserialisasi pada satu proses Node.js untuk mencegah lost update ketika beberapa pegawai mengunggah secara bersamaan.
- Pengujian 8 unggahan paralel membuktikan maksimal 5 diterima dan 3 ditolak.
- Batasan: lock ini hanya per proses. Deployment dengan beberapa instance Node.js masih memerlukan transaksi database atau optimistic concurrency control pada PostgreSQL sebelum dinyatakan siap produksi.

## V88 — Validasi lampiran dan audit penghapusan
- Menolak base64 non-kanonis dan padding rusak.
- URL metadata lampiran individual yang tidak didukung mengembalikan 404.
- Kegagalan hapus objek Supabase dicatat pada log server (belum ada retry otomatis).
- Batasan: pengujian Supabase langsung, locking lintas-instance dan rekonsiliasi orphan masih diperlukan.

## V89 — Hardening lintas request dan privasi Lampiran Agenda
- Handler lampiran kini di-cache pada tingkat server, bukan dibuat ulang untuk setiap request. Ini membuat antrean unggahan per agenda bekerja untuk request HTTP yang berbeda pada satu instance Node.js.
- Daftar lampiran dan hasil unggah tidak lagi mengembalikan `key` privat Supabase kepada klien.
- Respons daftar lampiran diberi `Cache-Control: no-store`.
- DOCX dikirim sebagai `attachment` (unduh), bukan dipaksa tampil inline; file lain tetap inline sesuai MIME dengan `nosniff`.
- Metode selain GET/POST/DELETE ditolak secara eksplisit (405).
- Tes regresi baru `npm run v89-attachment-security-test` ditambahkan ke `release-check`.
- Catatan batasan: serialisasi hanya berlaku satu instance Node.js. Operasi edit/hapus agenda pada endpoint utama belum berada di antrean yang sama; untuk multi-instance dibutuhkan transaksi/locking database. Uji Supabase live, penghapusan file gagal, dan migrasi PostgreSQL penuh masih perlu dilakukan.

## V90 — PostgreSQL attachment concurrency (cross-instance)
- PostgreSQL payload repository now exposes `updateIfUnchanged`, using an atomic JSONB compare-and-swap in SQL.
- Agenda attachment upload and removal use compare-and-swap when supported. Concurrent conflicting requests return HTTP 409, avoiding silent metadata loss.
- Uploaded object is removed on CAS conflict; rollback failure is logged. Existing per-process queue retained for SQLite.
- Added automated simulated two-handler conflict test. Live PostgreSQL/Supabase staging validation remains outstanding.
