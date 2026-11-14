# Revisi Logbook — 4 November 2026

- Filter periode valid dan periode yang perlu diperiksa.
- Periode kosong/ambigu diurutkan terakhir untuk urutan naik maupun turun.
- Ringkasan jumlah catatan yang sesuai filter dan jumlah periode perlu diperiksa.
- Reset pencarian, pegawai, periode, kualitas, dan urutan.
- Ekspor CSV sesuai filter aktif, UTF-8 BOM, escape kutip, mitigasi formula spreadsheet.
- Tidak mengubah nilai sumber atau melakukan migrasi database.

Pengujian: npm run check, npm run frontend-test, npm run revisi-27-29-test, node scripts/logbook-quality-04nov-test.js.

Batasan: operasi browser langsung, PostgreSQL live, serta audit persyaratan Word menyeluruh belum dijalankan.
