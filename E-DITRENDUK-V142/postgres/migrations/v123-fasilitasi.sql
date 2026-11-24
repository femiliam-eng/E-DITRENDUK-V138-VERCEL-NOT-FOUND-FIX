-- V123: idempotent facilitation module table for upgrading older PostgreSQL installs.
CREATE TABLE IF NOT EXISTS fasilitasi (
 id text PRIMARY KEY,
 payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fasilitasi_updated ON fasilitasi(updated_at DESC);
