# Perbaikan Jenis Fasilitasi 4 November

- Endpoint autentikasi untuk unggah, buka, dan hapus bukti dukung kegiatan fasilitasi ditambahkan pada handler PostgreSQL.
- Lampiran hanya PDF, JPG, PNG; validasi signature dan maksimal 1 MB.
- Data lampiran tersimpan sebagai base64 dalam payload kegiatan PostgreSQL; cocok untuk bukti kecil, bukan penyimpanan file skala besar.
- UI menerima file sesuai batas backend dan menampilkan pesan kesalahan.
- Belum diuji dengan database PostgreSQL pengguna; endpoint hanya aktif jika konfigurasi PG_PRIMARY_AUTH dan PG_PRIMARY_PAYLOAD aktif.
