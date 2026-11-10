# Revisi lanjutan 4 November 2026
Acuan: REVISIAN27OKT26 (dasar) dan REVISI29OKT26 (koreksi terkait).

- Task Deadline/Agenda: pencarian hanya pada field data yang relevan, bukan metadata internal.
- Task Deadline/Agenda: menghapus batas tanggal minimum 2026 yang menghalangi edit data historis.
- Notifikasi: refresh setelah CRUD Agenda/Task dan pembaruan status berhasil, tanpa menunggu polling 30 detik.
- Notifikasi: abaikan reminder Done bila API menyediakan status.
- Profil: pengamanan agar perubahan password tidak terkirim dua kali; tombol pulih pada gagal/berhasil.
- Tes regresi baru: scripts/revision-27-29-regression.js.

Belum diuji pada PostgreSQL aktif, belum mengimpor seluruh Excel, belum deploy. Tidak diklaim final.
