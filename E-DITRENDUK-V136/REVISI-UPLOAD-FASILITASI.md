# Perubahan lanjutan

- Bukti fasilitasi: upload PDF, DOCX, JPG, PNG maksimal 5 MB melalui endpoint autentikasi PostgreSQL.
- Metadata file tersimpan dalam JSONB tabel `fasilitasi`; file privat disimpan di storage yang sama dengan lampiran Agenda.
- Daftar, buka, dan hapus bukti dari halaman fasilitasi.
- Operasi update metadata memakai compare-and-swap agar tidak menimpa perubahan paralel.
- Maksimal lima berkas per fasilitasi.

## Batasan

Belum diuji dengan PostgreSQL Windows milik pengguna; belum semua revisi 27 Oktober selesai. Storage lokal hanya untuk pengujian; produksi memerlukan penyimpanan privat yang dikonfigurasi. Jangan impor ulang SQLite.
