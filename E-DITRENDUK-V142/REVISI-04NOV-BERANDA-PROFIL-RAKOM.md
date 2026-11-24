# Perbaikan 4 November 2026 — Beranda, Profil, Repository, RAKOM

Acuan: **REVISIAN27OKT26 adalah dasar**; **REVISI29OKT26 mengoreksi bagian terkait**, bukan menggantikan dasar.

## Perubahan yang diterapkan
1. Menghilangkan benturan dua sumber angka progres Beranda: `js/v6.js` tidak lagi menimpa `weeklyProgress` dengan angka completion global.
2. Statistik dashboard dari API diperbarui saat data berubah pada tab aktif, tab lain, dan saat halaman kembali aktif; respons tidak valid ditolak.
3. KPI Tugas Belum Selesai tidak lagi mengambil fallback dari `disposisi` RAKOM ketika endpoint Task Deadline belum siap; menampilkan tanda belum tersedia.
4. Daftar tugas Beranda menampilkan status memuat daripada menampilkan data RAKOM sebagai tugas.
5. Badge status memakai kecocokan tepat sehingga `undone` tidak salah dianggap `done`.
6. Repository menangani kasus data monitoring belum terinisialisasi ketika menyimpan kegiatan baru.
7. Unggah foto profil memvalidasi MIME dan ukuran, mencegah klik berulang, memulihkan tombol setelah gagal/berhasil, dan menampilkan pesan proses.
8. Hapus foto profil juga mencegah permintaan berulang, memulihkan tombol, dan melaporkan kegagalan API.
9. Filter status RAKOM kini menyertakan `To Do` sesuai status yang tersedia.
10. Menambahkan 17 pemeriksaan regresi khusus perubahan ini.

## Hasil pemeriksaan
- `node --check` pada lima file JS yang diubah: lulus.
- `npm run frontend-test`: lulus (15 halaman).
- `npm run revisi-27-29-test`: lulus (14 pemeriksaan).
- `node scripts/revisi-dashboard-profile-regression-04nov.js`: lulus (17 pemeriksaan).

## Belum diverifikasi / tidak boleh diklaim final
- Impor Excel asli dan kelengkapan seluruh baris data.
- CRUD pada PostgreSQL aktif, autentikasi dua akun, unggah lampiran, dan notifikasi lintas pengguna.
- Belum deployment Supabase/Vercel.
