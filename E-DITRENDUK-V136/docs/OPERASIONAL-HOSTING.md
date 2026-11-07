# E-DITRENDUK — Panduan operasional hosting dan keamanan (V78)

## Arsitektur yang dituju
- Hosting Node.js persisten (Railway / Render / VPS instansi).
- PostgreSQL terkelola (Supabase atau PostgreSQL instansi).
- Supabase Storage bucket `notulen-private` (private).
- HTTPS dengan `APP_ORIGIN` domain/subdomain resmi.

**Status kode saat ini:** production-readiness gate masih sengaja BLOCK untuk runtime PostgreSQL penuh.
Jangan mematikan gate atau menganggap uji unit sebagai bukti kesiapan produksi.

## Konfigurasi minimum
Simpan sebagai environment variables di dashboard hosting, **jangan dalam ZIP/Git**:
`NODE_ENV=production`, `SESSION_SECRET` acak minimal 32 byte,
`APP_ORIGIN=https://subdomain-resmi`, `DATABASE_URL`, `NOTULEN_STORAGE_PROVIDER=supabase`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=notulen-private`.
Jika layanan memakai reverse proxy, pastikan cookie Secure, header proxy dan TLS dikonfigurasi benar.

## Backup PostgreSQL terenkripsi
Instal PostgreSQL client (`pg_dump`, `pg_restore`) pada mesin backup. Jangan mengandalkan
filesystem container aplikasi yang ephemeral. Set `BACKUP_OUTPUT_DIR` ke volume/tujuan
backup di luar source, `DATABASE_URL`, `PGPASSWORD` bila perlu, dan
`BACKUP_ENCRYPTION_PASSPHRASE` rahasia minimal 24 karakter.

1. `npm run pg-backup-secure`
2. `npm run pg-backup-inspect -- /path/to/file.pgbak.enc`
3. Simpan backup dan passphrase **terpisah**. Rotasi serta uji restore berkala ke
   database pengujian terisolasi. Script inspect **tidak** memulihkan data.
4. Backup PostgreSQL **tidak mencakup file Supabase Storage**. Gunakan backup
   object storage terpisah, inventaris file dan prosedur pemulihan dokumen.

## Pemeriksaan setelah deployment staging
- `npm run public-url-smoke -- https://subdomain-resmi`
- `npm run public-security-smoke -- https://subdomain-resmi`
- Uji akun Superadmin, Admin, Pegawai (aktif/nonaktif), hak akses dan notulensi
  dengan **data uji**, bukan data pribadi.
- Pastikan 403/404 untuk source/config, 401/403 untuk API privat, tidak ada
  kebocoran error atau token di log.
- Domain tetap menunggu persetujuan nama oleh pejabat yang berwenang.

## Keputusan hosting
Railway/Render mendukung proses Node.js persisten; Vercel serverless membutuhkan
adaptasi arsitektur yang lebih besar. Semua pilihan membutuhkan kuota,
biaya, dan pengelolaan backup/storage yang diperiksa sesuai kebutuhan instansi.

## Backup Supabase Storage (V79)
Paket backup dokumen sekarang tersedia terpisah dari backup database.
Gunakan akun service-role **hanya pada mesin backup privat** (jangan kirim ke browser).
Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`,
`BACKUP_OUTPUT_DIR` (di luar source) dan `BACKUP_ENCRYPTION_PASSPHRASE`.
- `npm run supabase-backup`: membaca objek bucket privat dan menyimpan masing-masing
  sebagai file AES-256-GCM; nama/hash file dicatat di `manifest.json`.
- `npm run supabase-backup-verify -- /folder/hasil-backup`: memeriksa dekripsi
  serta checksum tanpa mengunggah dokumen kembali.
- Script ini hanya mendukung object key datar `.pdf`, `.doc`, `.docx` sesuai
  aturan aplikasi; akan **gagal tertutup** jika menemukan folder atau nama tak dikenal.
- Backup ini **belum** mencakup restore otomatis. Pemulihan wajib diuji di
  bucket uji terisolasi sebelum dipakai untuk pemulihan sungguhan.
- Simpan manifest secara privat karena berisi nama file dan hash; jangan
  menyimpan service role key dan passphrase dalam repository.

## Pemulihan dokumen ke staging (V80)
Sebelum mencoba pemulihan, siapkan bucket privat **baru** dengan nama berakhiran
`-staging`, `-test`, atau `-sandbox`, di proyek Supabase uji. Jangan gunakan
bucket produksi. Gunakan kredensial service role proyek uji saja.

1. Set `BACKUP_ENCRYPTION_PASSPHRASE`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   dan `RESTORE_TARGET_BUCKET=notulen-restore-staging`.
2. Jalankan `npm run supabase-restore-staging -- /folder/backup` untuk **dry-run**.
3. Setelah memeriksa rencana dan tujuan, set
   `RESTORE_CONFIRM=RESTORE_TO_notulen-restore-staging`.
4. Jalankan kembali perintah yang sama. `NODE_ENV=production` ditolak.
5. Bandingkan daftar file dan lakukan uji unduh menggunakan akun uji.

Pemulihan **tidak** menghapus atau menimpa objek lama; jika ada objek bernama
sama, proses akan gagal. Operasi tidak transaksional: jika gagal di tengah,
sebagian dokumen mungkin sudah terunggah ke bucket uji. Bersihkan bucket uji
secara manual sebelum mengulang. Script hanya mendukung object key datar
`.pdf`, `.doc`, `.docx`, dengan ukuran maksimal 6 MB per dokumen.

## V82: Perlindungan restore dan status rilis
Sebelum restore staging, semua nama file tujuan diperiksa; bila ada yang sama, restore dibatalkan tanpa unggahan. Pemeriksaan ini tidak menggantikan perlindungan x-upsert=false jika terjadi perubahan bersamaan. Jalankan `npm run release-status` untuk melihat hambatan produksi secara eksplisit; status ini bukan bukti pengujian live.

## V84 — Lampiran Surat Agenda
Buat bucket **private** Supabase Storage `agenda-private` (atau atur `AGENDA_STORAGE_BUCKET`).
Service role key hanya di server. File tidak boleh tersedia sebagai URL publik.
API autentikasi: GET/POST `/api/agenda/:id/attachments`, DELETE `/api/agenda/:id/attachments/:attachmentId`, GET `/api/agenda/:id/attachments/:attachmentId/file`.
Maksimal lima lampiran per agenda, lima MB per file. Format PDF, DOCX, JPG, PNG.
**Perhatian:** backup Supabase yang ada saat ini menggunakan bucket Notulensi saja. Bucket Agenda perlu backup terpisah. Penghapusan agenda dan pengunggahan serentak masih membutuhkan pengujian integrasi serta kebijakan pembersihan objek sebelum produksi.
