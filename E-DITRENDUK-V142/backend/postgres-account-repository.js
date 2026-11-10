'use strict';
// Async PostgreSQL account persistence. Does not log passwords or hashes.
const FIELDS = 'id,username,email,password_hash,name,role,status,unit,permissions,must_change_password,created_at,updated_at';
function createPostgresAccountRepository(pool) {
  if (!pool || typeof pool.query !== 'function') throw new TypeError('PostgreSQL query client diperlukan');
  return Object.freeze({
    async byUsername(username) {
      const {rows} = await pool.query(`SELECT ${FIELDS} FROM accounts WHERE lower(username)=lower($1) LIMIT 1`, [String(username)]);
      return rows[0] || null;
    },
    async byId(id) {
      const {rows} = await pool.query(`SELECT ${FIELDS} FROM accounts WHERE id=$1`, [String(id)]);
      return rows[0] || null;
    },
    async list() {
      const {rows} = await pool.query(`SELECT ${FIELDS} FROM accounts ORDER BY name,id`);
      return rows;
    },
    async setPasswordHash(id, hash, mustChangePassword=false) {
      const {rowCount} = await pool.query('UPDATE accounts SET password_hash=$2,must_change_password=$3,updated_at=now() WHERE id=$1', [String(id),String(hash),Boolean(mustChangePassword)]);
      return rowCount === 1;
    },
    async setStatus(id,status) {
      if (!['Aktif','Nonaktif'].includes(status)) throw new RangeError('Status akun tidak dikenal');
      const {rowCount} = await pool.query('UPDATE accounts SET status=$2,updated_at=now() WHERE id=$1',[String(id),status]);
      return rowCount === 1;
    }
  });
}
module.exports={createPostgresAccountRepository};
