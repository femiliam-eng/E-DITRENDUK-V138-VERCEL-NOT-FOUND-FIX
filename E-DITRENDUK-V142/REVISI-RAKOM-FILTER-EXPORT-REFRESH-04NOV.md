# Revisi besar RAKOM — 4 November 2026

- Menambahkan reset filter, ekspor CSV sesuai filter aktif, jumlah hasil dan kualitas deadline.
- Menambahkan refresh API disposisi tanpa kehilangan filter aktif.
- Memperbaiki tanggal kosong dan tidak valid agar berada di akhir pada kedua arah urutan.
- Mempertahankan status asli yang tidak termasuk opsi standar.
- Pengamanan CSV terhadap formula injection.

**Batasan:** PostgreSQL aktif dan alur lintas akun belum diuji; belum siap dinyatakan 100%.
