
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE,
      password_hash TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Pegawai',
      status TEXT NOT NULL DEFAULT 'Aktif', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      unit TEXT NOT NULL DEFAULT 'DITRENDUK', permissions TEXT NOT NULL DEFAULT '[]',
      must_change_password INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS monitoring (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS logbook (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS archive (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users_data (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS disposisi (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS petugas (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY, topic TEXT NOT NULL, team TEXT, meeting_date TEXT, meeting_time TEXT,
      place TEXT, leader TEXT, notulis TEXT, checked_by TEXT, approved_by TEXT,
      approval_date TEXT, participants TEXT, status TEXT NOT NULL DEFAULT 'Draf',
      created_by TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS meeting_sections (
      id TEXT PRIMARY KEY, meeting_id TEXT NOT NULL, section_order INTEGER NOT NULL,
      title TEXT NOT NULL, FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS meeting_notes (
      id TEXT PRIMARY KEY, section_id TEXT NOT NULL, speaker TEXT, organization TEXT,
      body TEXT NOT NULL, note_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(section_id) REFERENCES meeting_sections(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, account_id TEXT, action TEXT NOT NULL, resource TEXT NOT NULL,
      resource_id TEXT, detail TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    );
    CREATE TABLE IF NOT EXISTS meeting_documentation (
      id TEXT PRIMARY KEY, meeting_id TEXT NOT NULL, file_name TEXT, data_url TEXT NOT NULL,
      photo_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  
