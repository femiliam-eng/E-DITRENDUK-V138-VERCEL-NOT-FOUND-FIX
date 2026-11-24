# E-DITRENDUK — Deployment V17

## Persiapan

1. Pasang Node.js >= 22.5 dan Docker Engine + Compose plugin bila menggunakan container.
2. Salin `.env.production.example` ke `.env` (jangan ikutkan `.env` dalam ZIP/repository).
3. Atur `APP_ORIGIN` ke URL HTTPS sebenarnya, `SESSION_SECRET` acak panjang, dan `POSTGRES_PASSWORD` bila memakai tools PostgreSQL.
4. Jalankan `npm run production-audit`, `npm run release-check`, dan `npm run backup` sebelum upgrade.

## Docker (SQLite runtime)

```sh
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Port default terikat ke `127.0.0.1:3000`; gunakan reverse proxy HTTPS yang meneruskan request ke sana. Siapkan TLS, firewall, pemantauan log, dan jadwal backup eksternal. Volume bernama menyimpan SQLite, upload, dan backup. **Jangan menjalankan banyak replika app yang menulis ke SQLite yang sama.**

## PostgreSQL

Service `postgres` memakai profile `postgres-tools` untuk staging/migrasi. `postgres-apply`, `postgres-import`, dan `postgres-check` **tidak** berarti HTTP runtime menggunakan PostgreSQL. Uji kesetaraan endpoint dan transaksi sebelum mengganti database utama.

## Verifikasi setelah deploy

Periksa `/api/health` dan `/api/ready`, uji login/logout di browser, unggah dan baca kembali foto Notulen, serta lakukan backup lalu verifikasi checksum. Deployment ke server sungguhan belum diverifikasi oleh paket ini.

## V18 — pemeriksaan sebelum deployment

Sebelum menggunakan server publik, salin `.env.production.example` menjadi `.env`, isi secret acak dan domain HTTPS sungguhan, lalu jalankan `npm run deploy-config-check -- .env`. Perintah ini memvalidasi konfigurasi dasar tanpa mencetak secret. Jangan mengunggah `.env` ke repositori atau mengirimnya melalui chat.

Buat backup dengan `npm run backup`, lalu uji backup terbaru menggunakan `npm run verify-backup -- backups/NAMA_FOLDER` dan `npm run restore-drill -- backups/NAMA_FOLDER`. Restore drill bekerja di folder sementara terisolasi; database aktif tidak ditimpa. Tetap wajib menguji restore di staging sebelum production.

**Batasan:** Runtime HTTP V18 masih SQLite. PostgreSQL hanya untuk persiapan/migrasi data. Docker/HTTPS di server publik, backup eksternal, dan pemulihan bencana sungguhan masih memerlukan pengujian operasional.

## Gate PostgreSQL V19 (staging saja)

1. Siapkan PostgreSQL staging kosong dan backup SQLite sumber.
2. Jalankan `npm run postgres-check`, `npm run postgres-apply`, dan `npm run postgres-import` menggunakan `DATABASE_URL` staging.
3. Jalankan `npm run postgres-parity` untuk mendeteksi perbedaan jumlah record; hasil beda berarti **jangan cutover**.
4. Tetap jalankan layanan HTTP dengan SQLite. Parity jumlah record bukan validasi fitur HTTP PostgreSQL.

Perintah ini memerlukan `psql` yang terpasang dan PostgreSQL yang dapat dijangkau. Tidak ada klaim tes database PostgreSQL hidup jika layanan tersebut tidak tersedia.

## Pemeriksaan paket V20

Sebelum deploy, jalankan `npm run verify-release` pada paket yang baru diekstrak, kemudian `npm run release-check` dan lakukan uji manual login serta alur kerja di staging. Manifest akan gagal jika source telah diedit; untuk revisi yang disengaja, jalankan ulang tes lalu buat manifest baru. Jika staging PostgreSQL tersedia, `npm run postgres-live-gate` dapat dijalankan setelah import data. Aplikasi HTTP masih menggunakan SQLite; jangan mengubah `DB_DRIVER` ke `postgres` sebelum adapter runtime selesai.

### Gate staging V21
Setelah `postgres-import`, jalankan `npm run postgres-live-gate` dengan `DATABASE_URL` yang menunjuk staging. Ini **tidak mengaktifkan** runtime PostgreSQL; jangan mengganti database production sebelum adapter dan pengujian endpoint tersedia.

### Catatan V22

Tetapkan `DB_DRIVER=sqlite` pada deployment saat ini. Nilai `postgres` belum didukung oleh runtime HTTP dan akan menyebabkan startup gagal secara sengaja. PostgreSQL staging masih untuk tool migrasi dan parity. `.env` privat tetap harus disimpan lokal, tidak dimasukkan ke paket rilis.

### V23

Jangan aktifkan `DB_DRIVER=postgres` pada aplikasi HTTP. Jalankan `npm run postgres-sql-audit` sebagai inventaris migrasi; aplikasi produksi tetap memakai SQLite sampai adapter dan uji integrasi tersedia.

## V24 — Database runtime

Gunakan `DB_DRIVER=sqlite` untuk deployment saat ini. `DB_DRIVER=postgres` sengaja ditolak sebelum SQLite dibuka. Jalankan `npm run database-adapter-test` dan `npm run release-check` sebelum deployment.

## V25 — Pemeriksaan rilis

Jalankan `npm run migrate`, `npm run release-check`, lalu `npm run release-manifest` setelah semua perubahan selesai. Verifikasi arsip dengan `npm run verify-release` sebelum mengedit sumber. Runtime tetap SQLite.

### V26

Tidak ada perubahan variabel environment; jalankan `npm run release-check` sebelum deployment. PostgreSQL runtime belum tersedia.

### Catatan V28

Audit dan metadata storage sekarang memakai repository SQLite terpisah. Folder `uploads/notulen` dan database SQLite tetap harus disimpan secara persisten dan dibackup bersama. Ini belum mengaktifkan runtime PostgreSQL.

### V30 — Verifikasi kode backend

Jalankan `npm run verify-release` pada arsip rilis asli sebelum mengedit file. Manifest kini mencakup `backend/*.js` dan mengecualikan `backend/data`. Setelah mengubah kode secara sengaja, buat manifest baru dengan `npm run release-manifest`, kemudian verifikasi ulang. Jangan masukkan file `.env`, database runtime, atau upload pengguna ke paket rilis.

## V31: PostgreSQL staging
Set `DATABASE_URL` secara lokal tanpa memasukkan password ke Git. Jalankan `npm run postgres-check`, `npm run postgres-apply` pada database kosong, lalu `npm run postgres-live-smoke`. Jangan menganggap ini deployment production; hosting, TLS, backup, dan migrasi runtime API masih perlu diselesaikan.

### Status V32
Belum ada dukungan HTTP runtime PostgreSQL maupun deployment production yang tervalidasi. `npm start` masih memakai SQLite. Jangan set `DB_DRIVER=postgres` untuk website saat ini. Perintah `postgres-check`, `postgres-apply`, dan `postgres-live-smoke` hanya memeriksa database PostgreSQL secara terpisah.

V33: `npm run postgres-account-adapter-test` menguji adapter akun PostgreSQL secara offline. Runtime HTTP masih SQLite; koneksi PostgreSQL live diuji terpisah melalui `npm run postgres-check`.

### Catatan V34
PostgreSQL session adapter masih tahap persiapan dan belum terhubung ke API. Untuk menjalankan website tetap gunakan SQLite.

### Status V35
PostgreSQL live connection dapat diuji dengan `npm run postgres-check`, tetapi `npm start` tetap SQLite. Jangan set `DB_DRIVER=postgres` sampai runtime HTTP PostgreSQL selesai dan teruji.

### V36
Mode `PG_READ_PREVIEW=1` hanya untuk pengujian lokal/staging. Jangan gunakan sebagai klaim PostgreSQL production runtime. `DB_DRIVER` tetap `sqlite`. Jalankan `npm install` untuk dependency `pg`; simpan DATABASE_URL sebagai environment lokal, bukan di repository.

V37: jangan gunakan PostgreSQL preview sebagai runtime production; endpoint hanya read-only dan login masih SQLite.

## V38
Endpoint parity hanya aktif bila PG_READ_PREVIEW=1 dan memerlukan sesi Superadmin. Ini alat diagnostik hybrid, bukan bukti kesiapan PostgreSQL runtime atau deployment production.


### V39
`PG_WRITE_PREVIEW=1` mengaktifkan operasi tulis PostgreSQL secara eksplisit. Gunakan hanya pada lingkungan pengujian dan dengan akun Superadmin. Jangan aktifkan di production. Runtime utama masih SQLite; deployment PostgreSQL penuh belum tersedia.

## V40
Pastikan direktori `uploads/notulen` persisten dan masuk backup bersama database SQLite. Fitur pengumpulan notulensi belum menggunakan PostgreSQL.


## V41 (revisi dari V40) — Pengumpulan notulensi tanpa tim kerja
- Kolom **Tim Kerja** dihapus dari formulir pengumpulan hasil notulensi.
- Daftar hasil pengumpulan tidak lagi menampilkan tim kerja atau placeholder tim.
- API unggah mengabaikan atribut tim untuk pengumpulan baru; kolom lama dipertahankan agar dokumen sebelumnya tidak rusak.
- Semua pegawai tetap dapat mengunggah hasil rapat; tampilan unit kerja di Beranda tetap ada.
- Ditambahkan tes regresi `npm run notulen-no-team-test`.
- Paket distribusi mengecualikan database SQLite lokal, WAL/SHM, dan dokumen unggahan; jangan gunakan versi ini sebagai bukti keamanan produksi.

## V42 — Gerbang sebelum publikasi
**STOP: Jangan publikasikan data instansi asli.** Server production sekarang sengaja gagal startup jika akun belum diprovisi, ada password bawaan, secret terlalu pendek, atau SQLite belum mendapat override eksplisit. Override bukan pengganti review keamanan.
Syarat deployment resmi: persetujuan instansi, HTTPS, autentikasi tanpa kredensial bawaan, PostgreSQL sebagai runtime utama, storage unggahan persisten dan privat, backup terenkripsi beserta uji restore, pembatasan akses, audit keamanan independen, dan prosedur respons insiden. Infrastruktur Cloudflare Tunnel/laptop pribadi bukan pengganti hosting produksi instansi.

## V43 — pengamanan unggahan dan origin
- Pengumpulan notulensi: batas 20 unggahan per akun per 15 menit, pemeriksaan tanggal kalender, nama file/ekstensi, dan signature PDF/DOC/DOCX.
- Origin development localhost tidak lagi diizinkan sebagai pengecualian pada production. Cookie logout memakai Secure saat production.
- Runtime HTTP tetap SQLite; PostgreSQL utama, backup dan audit keamanan independen belum selesai. Jangan gunakan data instansi asli pada hosting publik.

### V44: lokasi unggahan persisten
Set `NOTULEN_UPLOAD_DIR` ke path absolut pada volume persisten di luar direktori aplikasi. Verifikasi mount, backup, akses file dan restore secara manual sebelum mengatur `CONFIRM_PERSISTENT_UPLOAD_STORAGE=YES`. Flag tidak menciptakan disk persisten. Render Free tidak menyediakan persistent disk; **jangan gunakan untuk dokumen asli**. Database utama masih SQLite dan diblokir di production tanpa override berisiko dari V42.

### Status V45
`PG_PRIMARY_PAYLOAD=1` adalah uji integrasi API tujuh modul dengan PostgreSQL **untuk development**, bukan deployment production. Production menolak mode hybrid. Jangan mengaktifkan website publik dengan data instansi sebelum seluruh subsistem dipindah, migrasi diuji, penyimpanan dan backup diverifikasi, serta keamanan diaudit.


### V46 PostgreSQL
`npm run postgres-notulen-migrate` membuat tabel pengumpulan notulensi di database PostgreSQL yang telah ada. Sebelum `npm run postgres-import`, backup kedua database dan pastikan migrasi telah berjalan. Import tidak menyalin file fisik upload. Server HTTP masih hybrid SQLite/PostgreSQL dan belum disetujui untuk data asli di internet.

### V47 — syarat sebelum deployment
Jalankan `npm run postgres-runtime-gate` terhadap PostgreSQL tujuan dan pastikan `ok: true`. Ini hanya syarat awal: API utama, login, session, audit, dan notulensi belum sepenuhnya PostgreSQL; penyimpanan dokumen permanen, backup dan pengujian akses wajib dituntaskan sebelum produksi. Jangan buka Cloudflare Tunnel atau layanan publik untuk data instansi pada versi ini.

### V48 — Gate sebelum production
Jalankan `npm run postgres-runtime-gate` lalu `npm run postgres-primary-live-crud` pada database staging. Lulusnya kedua uji **tidak** membuktikan kesiapan production karena autentikasi/session dan metadata notulensi masih SQLite.

### V49: gate sebelum migrasi login
`npm run postgres-auth-live-smoke` memvalidasi repository akun/session pada PostgreSQL asli. PASS bukan bukti login HTTP sudah PostgreSQL atau siap produksi. Jangan publikasikan data instansi sebelum migrasi runtime dan audit selesai.

### V50 batasan deployment
`PG_PRIMARY_AUTH=1` merupakan mode integrasi parsial development saja. Production sengaja menolak startup. Belum boleh digunakan untuk data instansi asli secara publik.

## V51 — PostgreSQL auth self-service (development only)
- Mode `PG_PRIMARY_AUTH=1` kini menghubungkan HTTP `POST /api/auth/change-password`, `GET /api/auth/sessions`, dan `DELETE /api/auth/sessions/:id` ke repository PostgreSQL.
- Pemeriksaan sesi dan kepemilikan dilakukan melalui PostgreSQL, bukan SQLite. Perubahan password mencabut sesi lain.
- Tes kontrak `postgres-auth-selfservice-test` ditambahkan ke `release-check`.
- **Batasan:** mode ini tetap development-only; API modul lain tetap dinonaktifkan dalam mode PG_PRIMARY_AUTH. Belum siap deployment publik, belum diverifikasi ke PostgreSQL 18 pengguna.

## V52 — Paket persiapan URL publik (belum deployment)

- Docker Compose sekarang mengarahkan folder notulensi ke `/var/lib/editrenduk/notulen` di dalam container, dengan volume bernama `editrenduk_uploads` dan lokasi di luar source `/app`. Ini memperbaiki konflik startup pengaman V44.
- Dockerfile membuat direktori tersebut dan memberi akses tulis ke user `node`.
- `CONFIRM_PERSISTENT_UPLOAD_STORAGE=NO` adalah default aman; operator hanya boleh mengganti ke `YES` setelah memastikan volume, backup, dan restore di server sungguhan. Volume Docker lokal tidak otomatis menjadi backup eksternal.
- Jalankan `npm run deployment-kit-test` untuk menguji kontrak konfigurasi; setelah situs terpasang jalankan `npm run public-url-smoke -- https://URL-RESMI` untuk GET halaman awal, health, dan ready. Ini bukan audit keamanan menyeluruh.
- URL aktif hanya dapat diterbitkan oleh hosting/server yang dapat diakses internet dengan DNS, HTTPS, penyimpanan persisten, dan izin instansi. Belum ada server, domain, atau akun hosting yang dikonfigurasi otomatis oleh ZIP.
- **Penting:** Docker Compose production saat ini masih menjalankan SQLite, bukan PostgreSQL. Mode PostgreSQL HTTP V51 masih parsial dan diblokir di production. Jangan masukkan data riil instansi sebelum persetujuan dan pengujian operasional.

### V57 — perbaikan akar masalah identitas dan notifikasi
- `js/api.js` kini mengekspor `window.API = API`. Sebelumnya `const API` hanya tersedia sebagai global lexical binding, sementara `js/layout.js` memeriksa `window.API`, sehingga pemuatan sesi `/api/auth/me` dilewati, nama akun menjadi placeholder, dan notifikasi Superadmin tidak pernah diambil.
- Tes regresi `npm run frontend-api-global-test` memverifikasi ekspor API. Setelah update, restart server dan hard refresh browser.


V58: Notifikasi reset Superadmin kini menggunakan endpoint /api/password-reset-requests yang sama dengan tabel Pengguna, memfilter status Menunggu, dan mematikan cache. Pemeriksaan role menu Pengguna dibuat case-insensitive. Uji akun aktual tetap diperlukan.

## V59 — Fail-closed session dan data workspace
Workspace sekarang menolak akses bila API/session gagal dimuat, identitas akun tidak lengkap, atau bootstrap data backend gagal. Tidak lagi diam-diam menampilkan data frontend yang bisa menyesatkan pengguna. Tes: `npm run frontend-auth-failclosed-test`. Perubahan ini bukan pengganti integrasi PostgreSQL penuh atau hosting production.
\n\n## V60 — Pemeriksaan kelayakan operasional\n\n`npm run production-readiness-gate` memeriksa prasyarat produksi dan **sengaja gagal** selama seluruh HTTP runtime belum menggunakan PostgreSQL. `npm run production-readiness-gate-test` memverifikasi perilaku fail-closed. Gate bukan bukti deployment, dan tidak mengaktifkan URL publik.\n

## PEMBARUAN V123 (05 November 2026) — jalur migrasi PostgreSQL yang benar

Petunjuk lama di atas mencerminkan versi hybrid/SQLite dan bukan panduan runtime produksi terbaru. Gunakan `V123-GO-LIVE-MIGRASI-AMAN.md`. Untuk instalasi atau upgrade gunakan `npm run postgres-migrate-safe -- --plan` lalu, **hanya setelah backup dan konfirmasi target**, `CONFIRM_DATABASE_MIGRATION=<nama_db> npm run postgres-migrate-safe -- --apply`. Jangan menjalankan skema manual berulang di database produksi.
