const assert=require('node:assert/strict');
const fs=require('node:fs');
const s=fs.readFileSync(require('node:path').join(__dirname,'../server.js'),'utf8');
const section=s.slice(s.indexOf('// PostgreSQL auth self-service:'),s.indexOf("if(PG_PRIMARY_AUTH) return json(res,503"));
for(const method of ['pgAccounts.setPasswordHash','pgSessions.revokeForAccount','pgSessions.listActiveForAccount','pgSessions.ownedSession','pgSessions.revokeById','pgSessions.findActiveByTokenHash']) assert.ok(section.includes(method),method);
for(const forbidden of ['accountRepository.','sessionRepository.','db.prepare(']) assert.ok(!section.includes(forbidden),forbidden);
assert.ok(section.includes("user.status!=='Aktif'"));
console.log('PASS PostgreSQL HTTP auth self-service route contract');
