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
