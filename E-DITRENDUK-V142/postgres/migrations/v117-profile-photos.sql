-- V117: Required by PostgreSQL-only profile photo endpoints.
-- Idempotent; photos are private and always scoped by account ID.
CREATE TABLE IF NOT EXISTS ed_profile_photos (
 account_id text PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
 mime text NOT NULL CHECK (mime IN ('image/png','image/jpeg','image/webp')),
 content bytea NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
