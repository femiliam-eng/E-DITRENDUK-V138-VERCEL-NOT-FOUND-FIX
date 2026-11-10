# E-DITRENDUK V119 — hardening reverse proxy dan login

## Perubahan
- `server-postgres.js`: pengenal IP karyawan `clientIp()` yang default-nya memakai `req.socket.remoteAddress` dan hanya membaca `X-Real-IP` dari `TRUSTED_PROXY_IPS` yang dikonfigurasi operator. Tidak memakai header `X-Forwarded-For` tak tepercaya.
- Login per-IP, jejak IP pada sesi, dan reset kata sandi memakai pengenal IP yang sama.
- `scripts/v119-trusted-proxy-http-test.js`: tes spoofing header, nilai header tidak valid, blokir 31 percobaan dari satu IP, serta isolasi IP pengguna lain.
- `.env.production.example`: petunjuk konfigurasi proxy tepercaya.

## Penting untuk operator
- Jangan isi `TRUSTED_PROXY_IPS` dengan `0.0.0.0/0`, IP klien atau rentang jaringan tidak dipercaya. Gunakan *alamat peer proxy persis* yang terlihat oleh aplikasi; implementasi ini menerima IP tunggal dipisah koma, **bukan CIDR**.
- Proxy wajib **menimpa** `X-Real-IP` dari klien, jangan meneruskannya mentah. Jika platform tidak menyediakan jaminan ini, biarkan tidak diisi.
- Uji jalur proxy nyata sebelum membuka URL untuk karyawan; mode tanpa proxy tepercaya dapat menjadikan semua pengguna satu IP di belakang gateway dan memicu 429 bersama.
- Ini bukan pengujian produksi: belum ada hosting, database online, migrasi data asli atau akun karyawan untuk tes lapangan.

## Progres
- Progres kesiapan source: sebelumnya diestimasi 94%, setelah perubahan ini masih **94% (belum diukur ulang dengan rubric lengkap)**.
- Progres pemakaian online: **belum live**. Tidak ada bukti untuk klaim 100% atau kenaikan 10 poin.
