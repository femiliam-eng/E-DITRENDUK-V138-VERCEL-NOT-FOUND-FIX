-- E-DITRENDUK PostgreSQL target schema (V8)
-- Jalankan pada database PostgreSQL kosong sebelum proses import.
CREATE TABLE accounts (
 id text PRIMARY KEY, username text UNIQUE NOT NULL, email text UNIQUE, password_hash text NOT NULL,
 name text NOT NULL, role text NOT NULL DEFAULT 'Pegawai', status text NOT NULL DEFAULT 'Aktif',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 unit text NOT NULL DEFAULT 'DITRENDUK', permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
 must_change_password boolean NOT NULL DEFAULT false
);
CREATE TABLE monitoring (id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE logbook (id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE archive (id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE users_data (id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE disposisi (id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE petugas (id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE schedules (id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE meetings (
 id text PRIMARY KEY, topic text NOT NULL, team text, meeting_date text, meeting_time text, place text,
 leader text, notulis text, checked_by text, approved_by text, approval_date text, participants jsonb,
 status text NOT NULL DEFAULT 'Draf', created_by text REFERENCES accounts(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE meeting_sections (id text PRIMARY KEY, meeting_id text NOT NULL REFERENCES meetings(id) ON DELETE CASCADE, section_order integer NOT NULL, title text NOT NULL);
CREATE TABLE meeting_notes (id text PRIMARY KEY, section_id text NOT NULL REFERENCES meeting_sections(id) ON DELETE CASCADE, speaker text, organization text, body text NOT NULL, note_order integer NOT NULL DEFAULT 0);
CREATE TABLE meeting_documentation (id text PRIMARY KEY, meeting_id text NOT NULL REFERENCES meetings(id) ON DELETE CASCADE, file_name text, data_url text NOT NULL, photo_order integer NOT NULL DEFAULT 0);
CREATE TABLE audit_logs (id text PRIMARY KEY, account_id text REFERENCES accounts(id), action text NOT NULL, resource text NOT NULL, resource_id text, detail jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE storage_files (id text PRIMARY KEY, resource text NOT NULL, resource_id text NOT NULL, file_name text NOT NULL, stored_path text UNIQUE NOT NULL, mime_type text, size_bytes bigint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE auth_sessions (
 id text PRIMARY KEY, account_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, token_hash text UNIQUE NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 revoked_at timestamptz, user_agent text, ip_address text
);
CREATE INDEX idx_auth_sessions_account ON auth_sessions(account_id, created_at DESC);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(token_hash);
CREATE TABLE schema_migrations (version integer PRIMARY KEY, name text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_account ON audit_logs(account_id,created_at DESC);
CREATE INDEX idx_storage_files_resource ON storage_files(resource,resource_id);

-- V46: hasil pengumpulan notulensi (berbeda dari editor meetings lama).
CREATE TABLE IF NOT EXISTS notulen_submissions (
 id text PRIMARY KEY, topic text NOT NULL, team text, meeting_date text NOT NULL,
 file_name text NOT NULL, stored_path text NOT NULL, mime_type text NOT NULL,
 size_bytes bigint NOT NULL CHECK(size_bytes >= 0),
 uploaded_by text NOT NULL REFERENCES accounts(id),
 uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notulen_submissions_uploaded_at ON notulen_submissions(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_notulen_submissions_uploaded_by ON notulen_submissions(uploaded_by);

-- V65: modul Agenda Kegiatan dan Task Deadline.
-- V65: PostgreSQL storage for Agenda Kegiatan and Task Deadline.
-- Idempotent, preserves existing rows. Apply to a provisioned PostgreSQL database.
CREATE TABLE IF NOT EXISTS agenda_kegiatan (
 id text PRIMARY KEY,
 payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS task_deadline (
 id text PRIMARY KEY,
 payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);

-- V67: password reset requests
-- V67: reset password untuk autentikasi PostgreSQL; idempotent.
CREATE TABLE IF NOT EXISTS password_reset_requests (
 id text PRIMARY KEY,
 account_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 requested_identity text NOT NULL,
 status text NOT NULL DEFAULT 'Menunggu' CHECK(status IN ('Menunggu','Selesai')),
 requested_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz,
 resolved_by text REFERENCES accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_password_reset_pending ON password_reset_requests(account_id,status);

-- Fasilitasi: data native PostgreSQL, no SQLite fallback.
CREATE TABLE IF NOT EXISTS fasilitasi (
 id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fasilitasi_updated ON fasilitasi(updated_at DESC);

-- V116: shared, atomic login/reset/upload abuse throttling across replicas.
CREATE TABLE IF NOT EXISTS ed_request_limits (
 scope_key text NOT NULL,
 bucket bigint NOT NULL,
 count integer NOT NULL CHECK (count > 0),
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(scope_key,bucket)
);
CREATE INDEX IF NOT EXISTS idx_ed_request_limits_expiry ON ed_request_limits(expires_at);
-- Schedule periodic cleanup in managed PostgreSQL: DELETE FROM ed_request_limits WHERE expires_at < now() - interval '1 day';

-- V117: profile pictures in PostgreSQL-only runtime.
CREATE TABLE IF NOT EXISTS ed_profile_photos (
 account_id text PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
 mime text NOT NULL CHECK (mime IN ('image/png','image/jpeg','image/webp')),
 content bytea NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
