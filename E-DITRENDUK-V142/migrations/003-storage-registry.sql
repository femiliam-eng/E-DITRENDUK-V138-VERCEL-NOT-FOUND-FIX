CREATE TABLE IF NOT EXISTS storage_files (
  id TEXT PRIMARY KEY,
  resource TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  stored_path TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_storage_files_resource ON storage_files(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_created_at ON storage_files(created_at DESC);
