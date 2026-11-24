# ERD E-DITRENDUK — Backend V3

```mermaid
erDiagram
    ACCOUNTS ||--o{ MEETINGS : creates
    ACCOUNTS ||--o{ AUDIT_LOGS : performs
    MEETINGS ||--o{ MEETING_SECTIONS : contains
    MEETING_SECTIONS ||--o{ MEETING_NOTES : contains
    MEETINGS ||--o{ MEETING_DOCUMENTATION : has

    ACCOUNTS {
      text id PK
      text username UK
      text email
      text password_hash
      text name
      text role
      text status
      text unit
      text permissions
      integer must_change_password
    }
    MEETINGS { text id PK text topic text status text created_by FK }
    MEETING_SECTIONS { text id PK text meeting_id FK integer section_order text title }
    MEETING_NOTES { text id PK text section_id FK text speaker text organization text body }
    MEETING_DOCUMENTATION { text id PK text meeting_id FK text file_name text data_url }
    AUDIT_LOGS { text id PK text account_id FK text action text resource text resource_id }
```

Tabel operasional `monitoring`, `logbook`, `archive`, `disposisi`, `petugas`, dan `schedules` masih memakai kolom `payload` JSON pada tahap migrasi dari prototype Excel. Ini sengaja agar UI lama tetap kompatibel. Pada migrasi PostgreSQL production, field yang stabil dapat dinormalisasi menjadi kolom relasional.
