# V92 — menuju URL matang (checkpoint, BUKAN rilis produksi)

## Audit faktual
- `server.js` masih membuka SQLite tanpa syarat, membuat repository SQLite, dan menjalankan sejumlah rute SQLite langsung.
- `compose.yaml` masih menetapkan `DB_DRIVER: sqlite`; PostgreSQL hanya profile tools.
- `scripts/production-readiness-gate.js` sengaja memblokir `postgres-full-http-runtime`.
- Karena itu tidak aman mengklaim migrasi selesai atau memberi URL produksi palsu.

## Yang ditambahkan V92
- `npm run v92-public-url-check -- https://staging.example.org`: smoke test eksternal **read-only** untuk root, `/api/health`, dan `/api/ready`, dengan batas waktu dan tanpa mengikuti redirect.
- `npm run v92-public-url-check-test`: pengujian mock sukses/gagal dan penolakan URL HTTP/kredensial.
- `release-check` memasukkan tes baru. Tidak ada perubahan data pengguna.

## Tahapan wajib menuju publikasi
1. Migrasikan semua rute auth, session, payload, notulen, audit, meeting, admin, storage metadata, dan endpoint lain dari SQLite; inventaris seluruh query langsung di `server.js`.
2. Jadikan PostgreSQL sumber kebenaran tunggal; hilangkan pembukaan SQLite di mode PostgreSQL. Uji concurrent write dua instance pada database nyata.
3. Gunakan storage privat persisten (mis. Supabase) untuk dokumen; validasi ACL, signed URL, rollback, backup dan restore.
4. Jalankan integrasi end-to-end pada staging PostgreSQL + storage dengan data sintetis, termasuk auth, role, upload, konflik 409, pemulihan, dan regresi.
5. Jalankan `npm run production-readiness-gate` sampai semua status PASS **setelah** kode runtime penuh benar-benar selesai; jangan hapus blocker tanpa bukti.
6. Dapatkan persetujuan hosting instansi, domain, DNS, sertifikat TLS, rahasia environment, dan pemantauan.
7. Deploy staging, jalankan `PUBLIC_URL=https://... npm run v92-public-url-check`, `npm run public-security-smoke` sesuai dokumentasi, lalu go/no-go resmi.

## Batasan
Tidak ada kredensial Supabase, akses server hosting, domain, DNS, atau database staging di arsip. Maka URL nyata tidak dapat dibuat dari source ZIP saja. Jangan menaruh `SERVICE_ROLE_KEY`, `DATABASE_URL`, atau session secret ke frontend/ZIP publik.
