# Perbaikan keamanan Jenis Fasilitasi

- GET daftar dan bootstrap tidak lagi mengirim `fileBase64` seluruh lampiran ke browser.
- Metadata file tetap tersedia untuk tombol buka/hapus.
- POST/PATCH fasilitasi menolak perubahan langsung kolom `attachments`; gunakan endpoint lampiran yang memiliki validasi format dan ukuran.
- Batas ukuran pada label input konsisten 1 MB.
- Ini pemeriksaan kode; bukan bukti uji database PostgreSQL aktif.
