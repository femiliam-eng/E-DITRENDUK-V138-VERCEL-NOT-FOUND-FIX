# Revisi dashboard dan RAKOM — 4 November 2026

Acuan: REVISIAN27OKT26 adalah kebutuhan utama; REVISI29OKT26 mengoreksi butir terkait, tidak menggantikan seluruh dokumen.

## Perubahan terimplementasi
1. Menghapus angka progres minggu ini 78% yang sebelumnya hard-coded pada Beranda.
2. Menghitung progres dari status Done/Selesai pada tugas yang memiliki deadline minggu berjalan (Senin–Minggu).
3. Menampilkan tanda — dan penjelasan jika minggu tersebut tidak memiliki tugas bertenggat, bukan angka palsu.
4. Mendukung tanggal ISO, tanggal Indonesia numerik, dan tanggal dengan nama bulan Indonesia untuk kalkulasi mingguan.
5. Memperbarui progres dan KPI dari bootstrap server saat dashboard refresh.
6. Interval refresh dashboard menjadi 15 detik saat tab terlihat; notifikasi 15 detik; perubahan unit kerja akun 20 detik. Ini polling, bukan websocket.
7. Mempertahankan status RAKOM "To Do" yang berasal dari data, sehingga dropdown tidak keliru menampilkan Done.
8. Menetapkan progress To Do ke 0%; tidak lagi mengisi default progres In Progress dengan angka 50% buatan.

9. Memisahkan sumber Task Deadline dari RAKOM di dashboard: mengambil daftar dari API `/api/task-deadline`, bukan menghitung semua arahan direktur sebagai tugas.
10. Menyertakan field `hasilKegiatan` dalam daftar field yang disimpan backend PostgreSQL untuk Agenda Kegiatan (sebelumnya hilang saat normalisasi).
11. Menghapus pembatasan tahun minimum 2026 di backend Agenda/Task agar konsisten dengan frontend dan data historis.
12. Mengizinkan reminder untuk pengguna dengan izin Task Deadline saja, serta membatasi sumber reminder ke modul yang diizinkan.
13. Memperbarui tes backend untuk membuktikan data Hasil Kegiatan dan tanggal historis tetap disimpan.

## Belum teruji / belum selesai
- Tidak ada uji CRUD PostgreSQL aktif atau pengujian lintas akun.
- Data sumber Excel belum diimpor dalam revisi ini.
- Progres aplikasi keseluruhan tidak boleh dianggap 100% berdasarkan tes statis.
- Deployment ditunda atas permintaan pengguna.
