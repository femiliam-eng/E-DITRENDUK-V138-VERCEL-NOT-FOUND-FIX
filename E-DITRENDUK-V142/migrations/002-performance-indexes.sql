CREATE INDEX IF NOT EXISTS idx_audit_account_created ON audit_logs(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_created ON meetings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_creator ON meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_sections_meeting_order ON meeting_sections(meeting_id, section_order);
CREATE INDEX IF NOT EXISTS idx_notes_section_order ON meeting_notes(section_id, note_order);
