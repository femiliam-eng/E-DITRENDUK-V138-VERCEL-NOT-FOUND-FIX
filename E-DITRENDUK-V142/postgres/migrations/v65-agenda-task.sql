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
