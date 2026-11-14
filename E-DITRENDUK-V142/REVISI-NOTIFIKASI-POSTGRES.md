# Notifikasi PostgreSQL — revisi lanjutan

- Lonceng notifikasi kini mengambil agenda dan task deadline dari endpoint `/api/reminders` PostgreSQL setiap 30 detik saat tab aktif.
- Superadmin juga melihat permintaan reset password yang belum selesai.
- Penanda dibaca tersimpan per akun dalam sessionStorage browser (bukan status global di database).
- Tidak membutuhkan SQLite atau perubahan skema.
- Keterbatasan: polling 30 detik, bukan WebSocket/push; perubahan data antar pengguna akan tampil pada polling berikutnya.
- Masih perlu pengujian browser end-to-end dan PostgreSQL nyata untuk rilis.
