'use strict';
// V26: akses penyimpanan session dipisahkan dari HTTP handler; SQLite tetap runtime.
function createSessionRepository(db) {
  if (!db || typeof db.prepare !== 'function') throw new TypeError('Database wajib mendukung prepare()');
  return Object.freeze({
    create({ id, accountId, tokenHash, expiresAt, userAgent = '', ipAddress = '' }) {
      return db.prepare('INSERT INTO auth_sessions(id,account_id,token_hash,expires_at,user_agent,ip_address) VALUES(?,?,?,?,?,?)')
        .run(id, accountId, tokenHash, expiresAt, userAgent, ipAddress);
    },
    activeForAccount(accountId, now) {
      return db.prepare('SELECT id FROM auth_sessions WHERE account_id=? AND revoked_at IS NULL AND expires_at > ? ORDER BY created_at DESC').all(accountId, now);
    },
    findActiveByTokenHash(hash, now) {
      return db.prepare('SELECT * FROM auth_sessions WHERE token_hash=? AND revoked_at IS NULL AND expires_at > ?').get(hash, now);
    },
    touch(id) {
      return db.prepare('UPDATE auth_sessions SET last_seen_at=CURRENT_TIMESTAMP WHERE id=?').run(id);
    },
    revokeById(id) {
      return db.prepare('UPDATE auth_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE id=?').run(id);
    },
    revokeByTokenHash(hash) {
      return db.prepare('UPDATE auth_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=? AND revoked_at IS NULL').run(hash);
    },
    revokeForAccount(accountId, exceptId = '') {
      if (exceptId) return db.prepare('UPDATE auth_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE account_id=? AND id<>? AND revoked_at IS NULL').run(accountId, exceptId);
      return db.prepare('UPDATE auth_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE account_id=? AND revoked_at IS NULL').run(accountId);
    },
    listActiveForAccount(accountId, now) {
      return db.prepare('SELECT id,created_at,last_seen_at,expires_at,user_agent,ip_address FROM auth_sessions WHERE account_id=? AND revoked_at IS NULL AND expires_at > ? ORDER BY created_at DESC').all(accountId, now);
    },
    ownedSession(id, accountId) {
      return db.prepare('SELECT id FROM auth_sessions WHERE id=? AND account_id=?').get(id, accountId);
    }
  });
}
module.exports = { createSessionRepository };
