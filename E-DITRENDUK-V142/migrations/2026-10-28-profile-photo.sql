-- Jalankan sekali pada database PostgreSQL yang sama dengan DATABASE_URL.
CREATE TABLE IF NOT EXISTS ed_profile_photos (
 account_id TEXT PRIMARY KEY,
 mime TEXT NOT NULL CHECK(mime IN ('image/png','image/jpeg','image/webp')),
 content BYTEA NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
