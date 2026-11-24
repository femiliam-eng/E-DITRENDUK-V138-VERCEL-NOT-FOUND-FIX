CREATE TABLE IF NOT EXISTS password_reset_requests (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  identity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Menunggu',
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  resolved_by TEXT,
  FOREIGN KEY(account_id) REFERENCES accounts(id)
);
CREATE INDEX IF NOT EXISTS idx_password_reset_status ON password_reset_requests(status, requested_at DESC);
