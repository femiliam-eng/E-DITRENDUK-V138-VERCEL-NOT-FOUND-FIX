# V91 — Audit lanjutan migrasi PostgreSQL (checkpoint, bukan rilis produksi)

Tanggal audit: 2026-10-26.

## Bukti pemeriksaan
- `npm run release-check`: PASS (exit 0), termasuk tes V90 CAS.
- `npm run v83-runtime-inventory-test`: PASS.
- `npm run postgres-runtime-gate-test`: PASS.
- Inventaris statis `server.js`: 1 pembukaan SQLite, 31 baris akses SQLite langsung, 6 inisialisasi repository legacy.
- Production-readiness gate `postgres-full-http-runtime` masih sengaja BLOCK.

## Temuan kritis
`server.js` membuka SQLite tanpa syarat dan menjalankan inisialisasi skema, seed, serta pembaruan akun lokal. Penggunaan PostgreSQL masih bergantung pada beberapa flag terpisah. Jalur legacy notulensi, akun, payload dan audit masih perlu ditelusuri dan dipindahkan secara konsisten. Menghapus SQLite secara langsung tanpa mengganti semua jalur dapat merusak login, izin akses, atau penyimpanan.

## Rencana penyelesaian yang harus dibuktikan
1. Petakan seluruh cabang HTTP legacy ke repository dan pemeriksaan otorisasi yang sesuai.
2. Bangun satu konfigurasi PostgreSQL-only yang tidak membuka SQLite dan gagal tertutup bila konfigurasi tidak lengkap.
3. Pindahkan notulensi, audit, akun, payload, agenda/task, sesi dan reset password; pertahankan kontrak respons dan pemeriksaan hak akses.
4. Jalankan regresi setiap kelompok endpoint serta uji paralel, penolakan akses dan rollback.
5. Uji migrasi dan paritas data terhadap PostgreSQL staging, serta storage privat Supabase staging.
6. Buktikan backup/restore database dan file, kemudian audit ulang production gate.

## Batasan audit
Belum ada bukti koneksi ke PostgreSQL/Supabase staging atau pengujian deployment live. Status production tetap BLOCK. Dokumen ini adalah checkpoint investigasi, bukan klaim migrasi selesai.
