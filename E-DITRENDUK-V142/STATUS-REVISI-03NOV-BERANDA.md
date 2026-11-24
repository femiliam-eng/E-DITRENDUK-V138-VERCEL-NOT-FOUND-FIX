# Revisi 3 November — Beranda dan Repository

Acuan: REVISIAN27OKT26 sebagai dasar, REVISI29OKT26 mengoreksi poin yang sama. Source: paket revisi 31 Oktober yang telah diperbaiki.

## Perubahan terverifikasi pada kode
- Beranda polling /api/bootstrap setiap 30 detik saat tab aktif, refresh ketika tab kembali aktif.
- KPI beranda memakai data server terbaru, tidak menampilkan angka nol palsu jika request gagal.
- Status sinkronisasi tampil pada kartu unit kerja.
- Repository mencocokkan ID sebagai string, menolak ID hilang, mencegah perubahan status ganda selama penyimpanan.

## Batas verifikasi
- Ini pembaruan berkala 30 detik, bukan push real-time atau WebSocket.
- Belum ada pengujian browser end-to-end dan belum ada koneksi ke PostgreSQL pengguna.
- Tautan dokumen Repository hanya dapat dibuka jika data sumber menyediakan URL.
- Seluruh revisi 27–29 Oktober belum dinyatakan final.
