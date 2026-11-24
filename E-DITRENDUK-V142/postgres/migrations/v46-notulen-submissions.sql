BEGIN;
CREATE TABLE IF NOT EXISTS notulen_submissions (id text PRIMARY KEY,topic text NOT NULL,team text,meeting_date text NOT NULL,file_name text NOT NULL,stored_path text NOT NULL,mime_type text NOT NULL,size_bytes bigint NOT NULL CHECK(size_bytes >= 0),uploaded_by text NOT NULL REFERENCES accounts(id),uploaded_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_notulen_submissions_uploaded_at ON notulen_submissions(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_notulen_submissions_uploaded_by ON notulen_submissions(uploaded_by);
COMMIT;
