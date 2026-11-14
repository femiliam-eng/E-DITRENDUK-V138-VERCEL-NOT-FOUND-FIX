# Perbaikan notifikasi 3 November

Sumber: ZIP source 31 Oktober; REVISIAN27OKT26 dasar dan REVISI29OKT26 koreksi.

- Permintaan sinkronisasi notifikasi kini dicegah berjalan bersamaan.
- Saat popover notifikasi dibuka, aplikasi meminta pembaruan langsung dari server.
- Saat server gagal, daftar notifikasi terakhir tidak dihapus; pesan kegagalan ditampilkan dengan jelas.
- Polling 30 detik dan refresh saat tab aktif tetap dipertahankan.

Verifikasi: `npm run check`, `npm run frontend-test`, dan pemeriksaan ZIP.
Belum dibuktikan dengan pengujian browser dan PostgreSQL aktif. Ini bukan final seluruh revisi.
