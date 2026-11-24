# E-DITRENDUK V134 — Hasil perbaikan data Supabase (5 November 2026)

## Konfirmasi LANGSUNG dari database Supabase
Proyek: `e-ditrenduk` / `hgefzuctqokmlaruugjh` (Singapura).

| Tujuan | Baris di database |
|---|---:|
| Semua sumber Excel, 35 sheet (`ed_source_excel_rows`) | 7.089 |
| Agenda Kegiatan | 422 |
| Task Deadline | 53 |
| Monitoring Kegiatan | 46 |
| Logbook, berasal dari Output WFH 2026 | 461 |
| Arsip, dari Daftar Berkas dan Daftar Isi Berkas | 984 |
| Disposisi/RAKOM, dari Disposisi Tahun 2026 | 637 |
| Jenis Fasilitasi, dari Surat Pelayanan Fasilitasi | 33 |
| Akun pengguna | 22 |

**Status:** angka di atas telah dicek menggunakan query langsung ke database Supabase, bukan perkiraan dari ZIP. Tidak semua 7.089 baris adalah kegiatan; sebagian merupakan rumus, judul, metadata atau lembar tambahan dan disimpan **sebagaimana sumbernya**, bukan diubah menjadi kegiatan palsu.

## Perbaikan revisi
- Revisi 27 Oktober adalah basis; revisi 29 Oktober memperbaiki basis; revisi 5 November menambah perbaikan UI Jenis Fasilitasi dan Profil.
- Source V132/V133 sudah menyertakan layout workspace untuk Jenis Fasilitasi, serta profil diri, edit nama/foto/sandi dan riwayat aktivitas per akun.
- V134 menambahkan alat idempoten agar data operasional dapat dipublikasikan ulang dari tabel sumber.
- Arsip memuat entri *berkas* serta *item arsip*. Tanggal/keterangan yang berasal dari Excel dipertahankan dan harus divalidasi sebelum digunakan untuk keputusan resmi.
- Jenis fasilitasi yang tidak eksplisit mencantumkan metode Offline/Online/Hybrid diberi `Belum tercatat`; tidak dibuat-buat. Jenis sebagian dikategorikan memakai kata kunci judul dan perlu ditinjau.
- Status yang tidak tercatat untuk disposisi ditampilkan `Belum mulai` sebagai status awal teknis, bukan bukti karyawan belum mengerjakan.
- Berkas Drive/Google Docs hanya direferensikan oleh tautan sumber; **isi file dari Drive belum disalin ke Supabase Storage** dan akses tautan belum diverifikasi.

## Ulangi mapping TANPA menimpa baris lama
Gunakan koneksi PostgreSQL Supabase yang benar dalam `DATABASE_URL` (jangan bagikan kredensial):

```powershell
npm install
npm run publish-operational-v134
# Periksa hasil DRY_RUN dan pastikan backup/koneksi target benar
$env:CONFIRM_OPERATIONAL_PUBLISH='YES'
npm run publish-operational-v134 -- --apply
Remove-Item Env:CONFIRM_OPERATIONAL_PUBLISH
```

SQL menggunakan `INSERT ... ON CONFLICT DO NOTHING`: tidak menghapus atau menimpa catatan yang sudah ada, serta satu transaksi untuk lima modul. Pada proyek yang sudah dipopulasi 5 November, pemanggilan ulang seharusnya menghasilkan 0 baris baru.

## Yang masih harus diuji untuk produksi
1. Atur backend hosting agar memakai `DATABASE_URL` milik proyek Supabase ini.
2. Uji login 22 akun dengan akun uji yang berwenang (jangan bagikan sandi di chat).
3. Uji halaman Monitoring, RAKOM, Logbook, Arsip, Agenda, Task, Profil, Fasilitasi di browser, termasuk hak akses pegawai.
4. Periksa kualitas tanggal/status hasil ekstraksi Excel dan tautan Drive.
5. Siapkan Storage privat, backup/restore, serta URL HTTPS resmi sebelum dinyatakan go-live.

**Data tersimpan di Supabase ≠ website sudah 100% siap karyawan.**
