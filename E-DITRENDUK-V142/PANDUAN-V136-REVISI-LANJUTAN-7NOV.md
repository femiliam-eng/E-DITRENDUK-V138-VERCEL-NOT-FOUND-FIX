# V136 — Revisi lanjutan 7 November 2026

Revisi **hanya tampilan/perilaku**, tidak ada migrasi, reset, DELETE, UPDATE, atau impor ulang Supabase.

- Header dan kartu Profil Saya: avatar dipaksa **lingkaran 1:1** (clip-path dan radius 50%, termasuk foto JPEG/PNG lama).
- Foto yang diunggah: crop otomatis berbentuk lingkaran, PNG transparan 192×192 untuk menyimpan bentuk lingkaran (fokus lebih ke bawah agar wajah yang berada rendah pada gambar tidak terpotong).
- Jenis Fasilitasi: ukuran kartu, form, label, input, dan tombol diperkecil sesuai halaman lain.
- Logbook: dropdown **Januari–Desember** selalu lengkap, tanpa tanggal spesifik; label tabel dan editor menunjukkan bulan saja. Tahun yang sudah tersimpan pada data sumber tidak dihapus secara massal.
- Arsip: `Belum lengkap` merah, `Lengkap` hijau. Saat mengubah status, warna langsung mengikuti pilihan, dan kembali seperti semula bila penyimpanan ke database gagal.
- Nasib Akhir: `Musnah` merah, `Dinilai kembali` kuning lembut, `Permanen` biru muda. Perubahan langsung memengaruhi warna, tanpa mengubah data lain.

**Jalankan di VS Code** (dengan `.env` pribadi yang tidak dibagikan):

```powershell
npm install
npm run revisi-v136-test
node --env-file=.env scripts/postgres-check.js
node --env-file=.env server-postgres.js
```

Buka `http://localhost:3000/login.html`. Koneksi `.env` hanya untuk database Supabase yang sudah ada. Jangan jalankan migrasi, reset, atau impor ulang.

**Deploy URL Vercel:** kode memakai `api/index.js` dan `vercel.json`. Pastikan ada proyek Vercel berizin dan variabel lingkungan terenkripsi (`DATABASE_URL`, `APP_ORIGIN`, dll). Koneksi Vercel bukan berarti aplikasi sudah otomatis live. Uji Preview, login, dan izin sebelum production.
