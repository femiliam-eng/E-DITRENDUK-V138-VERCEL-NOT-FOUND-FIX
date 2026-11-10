'use strict';
// V30: validate meeting payload before any database or filesystem side effect.
function validateMeetingPayload(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return 'Data notulen harus berupa objek.';
  if (typeof b.topic !== 'string' || !b.topic.trim() || b.topic.length > 500) return 'Topik notulen wajib diisi (maksimal 500 karakter).';
  if (!Array.isArray(b.sections) || b.sections.length > 40) return 'Bagian notulen tidak valid (maksimal 40).';
  if (!Array.isArray(b.participants || []) || (b.participants || []).length > 500) return 'Peserta notulen tidak valid (maksimal 500).';
  if (!Array.isArray(b.documentation || []) || (b.documentation || []).length > 20) return 'Dokumentasi tidak valid (maksimal 20).';
  for (const section of b.sections) {
    if (!section || typeof section !== 'object' || Array.isArray(section) ||
      (section.title != null && (typeof section.title !== 'string' || section.title.length > 500)) ||
      !Array.isArray(section.notes || []) || (section.notes || []).length > 200) return 'Bagian atau catatan notulen tidak valid.';
    for (const note of section.notes || []) {
      if (!note || typeof note !== 'object' || Array.isArray(note) ||
        ['speaker','organization','body'].some(k => note[k] != null && typeof note[k] !== 'string')) return 'Catatan pembicara tidak valid.';
    }
  }
  for (const photo of b.documentation || []) {
    if (!photo || typeof photo !== 'object' || Array.isArray(photo) ||
      typeof photo.dataUrl !== 'string' ||
      (photo.fileName != null && typeof photo.fileName !== 'string')) return 'Format dokumentasi tidak valid.';
  }
  return null;
}
module.exports = { validateMeetingPayload };
