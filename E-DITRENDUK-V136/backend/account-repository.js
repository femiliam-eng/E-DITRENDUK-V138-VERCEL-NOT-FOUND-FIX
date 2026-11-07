'use strict';
// V27: SQLite account and password-reset queries isolated from HTTP routes.
function createAccountRepository(db) {
  if (!db || typeof db.prepare !== 'function') throw new TypeError('Database wajib mendukung prepare()');
  return Object.freeze({
    byId(id) { return db.prepare('SELECT * FROM accounts WHERE id=?').get(id); },
    byIdentity(identity) { return db.prepare('SELECT * FROM accounts WHERE username=? OR email=?').get(identity,identity); },
    activeIdentity(identity) { return db.prepare("SELECT id,username,email FROM accounts WHERE (username=? OR email=?) AND status='Aktif'").get(identity,identity); },
    byUsername(username) { return db.prepare('SELECT 1 FROM accounts WHERE username=?').get(username); },
    list() { return db.prepare('SELECT * FROM accounts ORDER BY name').all(); },
    create({id,username,email,passwordHash,name,role,status,unit,permissions,mustChangePassword}) {
      return db.prepare('INSERT INTO accounts(id,username,email,password_hash,name,role,status,unit,permissions,must_change_password) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,username,email,passwordHash,name,role,status,unit,permissions,mustChangePassword);
    },
    update({id,name,email,role,status,unit,permissions}) {
      return db.prepare('UPDATE accounts SET name=?,email=?,role=?,status=?,unit=?,permissions=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name,email,role,status,unit,permissions,id);
    },
    setPassword(id,hash,mustChange) {
      return db.prepare('UPDATE accounts SET password_hash=?,must_change_password=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(hash,mustChange?1:0,id);
    },
    pendingReset(accountId) { return db.prepare("SELECT id FROM password_reset_requests WHERE account_id=? AND status='Menunggu'").get(accountId); },
    requestReset(id,accountId,identity) { return db.prepare('INSERT INTO password_reset_requests(id,account_id,identity) VALUES(?,?,?)').run(id,accountId,identity); },
    resetRequests() { return db.prepare("SELECT r.*,a.name,a.username,a.email FROM password_reset_requests r JOIN accounts a ON a.id=r.account_id ORDER BY CASE r.status WHEN 'Menunggu' THEN 0 ELSE 1 END,r.requested_at DESC").all(); },
    pendingResetById(id) { return db.prepare("SELECT * FROM password_reset_requests WHERE id=? AND status='Menunggu'").get(id); },
    resolveReset(id,resolvedBy) { return db.prepare("UPDATE password_reset_requests SET status='Selesai',resolved_at=CURRENT_TIMESTAMP,resolved_by=? WHERE id=? AND status='Menunggu'").run(resolvedBy,id); }
  });
}
module.exports = {createAccountRepository};
