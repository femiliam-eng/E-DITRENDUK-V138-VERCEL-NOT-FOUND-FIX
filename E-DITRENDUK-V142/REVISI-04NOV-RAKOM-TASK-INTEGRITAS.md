# Perbaikan RAKOM dan Task Deadline — 4 November 2026

Acuan: REVISIAN27OKT26 adalah dasar; REVISI29OKT26 adalah koreksi.

- RAKOM: hilangkan progres minimum 1% yang tidak didukung data; progres 0% tetap 0% untuk status yang belum selesai.
- RAKOM: ubah status dan arahan yang berhasil disimpan memicu penyegaran Beranda/notifikasi dan sinkronisasi tab.
- RAKOM: menambah arahan juga memicu penyegaran, termasuk ketika array bootstrap belum ada.
- RAKOM: tampilkan pesan ketika filter/pencarian kosong.
- RAKOM: cegah klik Simpan ganda saat permintaan berlangsung.
- Agenda dan Task: pengurutan tidak memutasi urutan data sumber; pencarian memakai locale Indonesia.

**Batas verifikasi:** tes kode tidak membuktikan CRUD PostgreSQL hidup, kesesuaian data Excel, maupun notifikasi real-time antar-pengguna. Belum deploy.
