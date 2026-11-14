# Revisi lintas modul 4 November 2026

Acuan: REVISIAN27OKT26 (dasar), REVISI29OKT26 (koreksi).

- Dashboard menyegarkan angka setelah event perubahan data lokal atau dari tab lain; tetap polling 30 detik.
- Notifikasi disegarkan saat data berubah pada tab lain.
- Pengingat menerima tanggal format Indonesia DD/MM/YYYY selain ISO.
- Agenda dan Task menolak judul/tugas kosong dan tanggal kosong sebelum mengirim API.
- Perubahan Agenda dan Task memberitahu tab lain agar data diperbarui.
- Repository menolak tanggal rapat kosong dan memberi sinyal pembaruan dashboard/notifikasi setelah simpan berhasil.
- Jenis Fasilitasi memvalidasi kolom utama dan memberi sinyal pembaruan lintas tab setelah operasi berhasil.
- 12 pemeriksaan regresi baru.

Belum diverifikasi dengan PostgreSQL aktif; bukan klaim 100% selesai. Deployment belum dilakukan.
