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
