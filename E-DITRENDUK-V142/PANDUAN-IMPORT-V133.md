# E-DITRENDUK V133 — Impor Supabase Free

Proyek target: **e-ditrenduk**, region Singapura, project ref `hgefzuctqokmlaruugjh`.

1. Di Dashboard Supabase, buka proyek **e-ditrenduk** → **Connect** → salin PostgreSQL connection string, sebaiknya **Session Pooler** jika jaringan hanya IPv4. Gunakan password database asli dari dashboard, jangan kirim ke chat.
2. Buka folder proyek ini di VS Code → PowerShell, jalankan `npm install` lalu `.\IMPORT-SUPABASE-FREE.ps1`. Jika PowerShell menolak skrip, gunakan `powershell -ExecutionPolicy Bypass -File .\IMPORT-SUPABASE-FREE.ps1` hanya setelah memeriksa isi skrip.
3. Masukkan connection string di prompt tersembunyi; aplikasi memeriksa ref project dan melakukan dry-run. Setelah diverifikasi, ketik `IMPOR-7089`.
4. Harus tercatat 7089 baris mentah dari 35 sheet, serta 422 Agenda dan 53 Task terpetakan. SQL menggunakan `ON CONFLICT DO NOTHING` untuk menjaga data lama.

Impor ini **tidak** memigrasikan akun SQLite lama, dan **tidak** otomatis menerjemahkan seluruh 35 sheet menjadi modul operasional. Sisanya disimpan utuh di `ed_source_excel_rows` untuk pemetaan berikutnya. Untuk masuk ke aplikasi, akun PostgreSQL/Supabase harus dipulihkan terpisah. Jangan melakukan reset database.
