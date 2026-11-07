# V114 PostgreSQL atomic PATCH

Perbaikan: PATCH modul JSON sekarang menggunakan UPDATE ... payload=payload || $2::jsonb sehingga perubahan pada key berbeda tidak saling menghapus akibat read-modify-write. PUT tetap mengganti seluruh payload. Belum menjamin keseluruhan runtime PostgreSQL parity atau integrasi live.
