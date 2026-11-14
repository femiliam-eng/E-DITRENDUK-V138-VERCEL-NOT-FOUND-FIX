'use strict';
// V32: asynchronous PostgreSQL repository for the seven JSON-payload modules.
// No SQL identifiers come from user input. Supply a pg Pool or compatible client.
const TABLES = Object.freeze({monitoring:'monitoring',logbook:'logbook',archive:'archive',users_data:'users_data',disposisi:'disposisi',petugas:'petugas',schedules:'schedules',agenda_kegiatan:'agenda_kegiatan',task_deadline:'task_deadline',fasilitasi:'fasilitasi'});
function tableFor(resource) {
  if (!Object.hasOwn(TABLES, resource)) throw new Error('Resource tidak didukung');
  return TABLES[resource];
}
function createPostgresPayloadRepository(pool) {
  if (!pool || typeof pool.query !== 'function') throw new TypeError('PostgreSQL client dengan query() wajib disediakan');
  return {
    async list(resource) {
      const {rows} = await pool.query(`SELECT id, payload, updated_at FROM ${tableFor(resource)} ORDER BY id`);
      return rows;
    },
    async get(resource, id) {
      const {rows} = await pool.query(`SELECT id, payload, updated_at FROM ${tableFor(resource)} WHERE id=$1`, [id]);
      return rows[0] || null;
    },
    async create(resource, id, payload) {
      const {rows} = await pool.query(`INSERT INTO ${tableFor(resource)}(id,payload) VALUES($1,$2::jsonb) RETURNING id,payload,updated_at`, [id,JSON.stringify(payload)]);
      return rows[0];
    },
    async update(resource, id, payload) {
      const {rows} = await pool.query(`UPDATE ${tableFor(resource)} SET payload=$2::jsonb,updated_at=now() WHERE id=$1 RETURNING id,payload,updated_at`, [id,JSON.stringify(payload)]);
      return rows[0] || null;
    },
    // Atomic shallow JSON merge: simultaneous PATCH requests to distinct keys do not overwrite each other.
    async patch(resource, id, changes) {
      if (!changes || typeof changes !== 'object' || Array.isArray(changes)) throw new TypeError('Patch harus berupa objek');
      const {rows} = await pool.query(`UPDATE ${tableFor(resource)} SET payload=payload || $2::jsonb,updated_at=now() WHERE id=$1 RETURNING id,payload,updated_at`, [id,JSON.stringify(changes)]);
      return rows[0] || null;
    },
    // Optimistic compare-and-swap protects attachment metadata across app instances.
    async updateIfUnchanged(resource, id, previousPayload, nextPayload) {
      const {rows} = await pool.query(`UPDATE ${tableFor(resource)} SET payload=$3::jsonb,updated_at=now() WHERE id=$1 AND payload=$2::jsonb RETURNING id,payload,updated_at`, [id,JSON.stringify(previousPayload),JSON.stringify(nextPayload)]);
      return rows[0] || null;
    },
    async remove(resource, id) {
      const {rowCount} = await pool.query(`DELETE FROM ${tableFor(resource)} WHERE id=$1`, [id]);
      return rowCount > 0;
    }
  };
}
module.exports = {TABLES, tableFor, createPostgresPayloadRepository};
