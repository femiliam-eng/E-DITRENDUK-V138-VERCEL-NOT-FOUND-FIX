# E-DITRENDUK V142 — verifikasi revisi 9 November

Source berasal dari V141 yang mempertahankan patch login origin V139.

## Hasil pemeriksaan basis data (READ ONLY), 10 November 2026

Proyek Supabase e-ditrenduk, tabel `public.task_deadline`: **53 tugas, 40 belum selesai, 13 selesai, 53 ID unik**. SQL pemeriksaan: `select count(*), count(*) filter (where lower(trim(coalesce(payload->>'status',''))) in ('done','selesai','completed','selesai dikerjakan')) from public.task_deadline;`. Tidak ada perubahan basis data.

## Penanganan V142

- Beranda menghitung hanya dari API `/api/task-deadline`, deduplikasi berdasarkan ID, menampilkan ringkasan 40/13/53 berdasarkan data aktual saat login; angka tidak di-hardcode.
- Menghindari polling setiap 15 detik; penyegaran saat fokus, data berubah atau 5 menit ketika tab terbuka.
- Penjelasan angka dan sumber diperjelas; angka progres tanpa tugas minggu ini menjadi garis (bukan 0% yang membingungkan).
- Konsistensi font, alignment arahan dan kontrol urutan ditingkatkan.
- Revisi lain yang sudah ada di V141 dipertahankan: gambar HD login, edit fokus agenda/task, warna status arsip, filter arsip, profil, pengguna.

## Pengecekan wajib sebelum Production

- Jalankan pemeriksaan statis dari paket.
- Uji Preview dengan akun berhak akses Task Deadline: KPI harus menunjukkan 40 dari 53 menurut snapshot DB ini (angka dapat berubah jika pengguna menyunting tugas).
- Uji penyimpanan edit Agenda, Arsip, RAKOM; logout/login; izin akun pegawai; mobile.
- Periksa DevTools > Network jika total tidak sama dengan angka aktual API; pastikan deployment terbaru dan cache browser dimuat ulang.

**Belum dinyatakan 100% production-tested:** tidak ada kredensial pengguna untuk pengujian end-to-end live. Jangan menimpa Production sebelum uji Preview. Tidak menghapus/reset/import ulang Supabase.
