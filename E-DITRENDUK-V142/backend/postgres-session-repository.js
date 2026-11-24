'use strict';
// PostgreSQL session persistence contract; asynchronous, parameterized SQL.
function createPostgresSessionRepository(pool) {
  if (!pool || typeof pool.query !== 'function') throw new TypeError('PostgreSQL query client diperlukan');
  return Object.freeze({
    async create({id,accountId,tokenHash,expiresAt,userAgent='',ipAddress=''}) {
      const {rowCount}=await pool.query('INSERT INTO auth_sessions(id,account_id,token_hash,expires_at,user_agent,ip_address) VALUES($1,$2,$3,$4,$5,$6)',[id,accountId,tokenHash,expiresAt,userAgent,ipAddress]);
      return rowCount===1;
    },
    async findActiveByTokenHash(hash,now) {
      const {rows}=await pool.query('SELECT * FROM auth_sessions WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at>$2 LIMIT 1',[hash,now]);
      return rows[0]||null;
    },
    async activeForAccount(accountId,now) {
      const {rows}=await pool.query('SELECT id FROM auth_sessions WHERE account_id=$1 AND revoked_at IS NULL AND expires_at>$2 ORDER BY created_at DESC',[accountId,now]);
      return rows;
    },
    async touch(id) {const {rowCount}=await pool.query('UPDATE auth_sessions SET last_seen_at=now() WHERE id=$1 AND revoked_at IS NULL',[id]);return rowCount>0;},
    async revokeById(id) {const {rowCount}=await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL',[id]);return rowCount>0;},
    async revokeByTokenHash(hash) {const {rowCount}=await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL',[hash]);return rowCount>0;},
    async revokeForAccount(accountId,exceptId='') {
      const {rowCount}=exceptId ? await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE account_id=$1 AND id<>$2 AND revoked_at IS NULL',[accountId,exceptId]) : await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',[accountId]);
      return rowCount;
    },
    async listActiveForAccount(accountId,now) {
      const {rows}=await pool.query('SELECT id,created_at,last_seen_at,expires_at,user_agent,ip_address FROM auth_sessions WHERE account_id=$1 AND revoked_at IS NULL AND expires_at>$2 ORDER BY created_at DESC',[accountId,now]);return rows;
    },
    async ownedSession(id,accountId) {
      const {rows}=await pool.query('SELECT id FROM auth_sessions WHERE id=$1 AND account_id=$2 LIMIT 1',[id,accountId]);return rows[0]||null;
    }
  });
}
module.exports={createPostgresSessionRepository};
