'use strict';
// V25: repository khusus tabel payload; nama tabel tidak boleh berasal dari input bebas.
const ALLOWED_TABLES = Object.freeze(['monitoring','logbook','archive','users_data','disposisi','petugas','schedules']);
const allowed = new Set(ALLOWED_TABLES);
function tableName(table) {
  if (!allowed.has(table)) throw new RangeError(`Tabel payload tidak diizinkan: ${String(table)}`);
  return table;
}
function createPayloadRepository(db) {
  if (!db || typeof db.prepare !== 'function') throw new TypeError('Database wajib mendukung prepare()');
  return Object.freeze({
    list(table) {
      const name = tableName(table);
      return db.prepare(`SELECT payload FROM ${name} ORDER BY rowid`).all().map(row => JSON.parse(row.payload));
    },
    save(table, id, payload) {
      const name = tableName(table);
      if (id == null || String(id).length === 0) throw new TypeError('ID payload wajib diisi');
      db.prepare(`INSERT INTO ${name}(id,payload,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=CURRENT_TIMESTAMP`)
        .run(String(id), JSON.stringify(payload));
    }
  });
}
module.exports = { ALLOWED_TABLES, tableName, createPayloadRepository };
