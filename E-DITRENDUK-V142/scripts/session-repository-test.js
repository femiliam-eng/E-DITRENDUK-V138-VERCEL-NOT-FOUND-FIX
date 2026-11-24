'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDatabase } = require('../backend/database');
const { createSessionRepository } = require('../backend/session-repository');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'editrenduk-v26-'));
try {
  const db = openDatabase({dataDir:dir});
  try {
    db.exec(`CREATE TABLE auth_sessions (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at TEXT NOT NULL, revoked_at TEXT, user_agent TEXT, ip_address TEXT)`);
    const r = createSessionRepository(db);
    const now = new Date().toISOString();
    const future = new Date(Date.now()+3600000).toISOString();
    const past = new Date(Date.now()-3600000).toISOString();
    r.create({id:'s1',accountId:'a',tokenHash:'h1',expiresAt:future,userAgent:'test',ipAddress:'127.0.0.1'});
    r.create({id:'s2',accountId:'a',tokenHash:'h2',expiresAt:future});
    r.create({id:'expired',accountId:'a',tokenHash:'h3',expiresAt:past});
    r.create({id:'other',accountId:'b',tokenHash:'h4',expiresAt:future});
    assert.equal(r.activeForAccount('a',now).length,2);
    assert.equal(r.findActiveByTokenHash('h3',now),undefined);
    assert.equal(r.findActiveByTokenHash('h1',now).id,'s1');
    assert.equal(r.ownedSession('s1','b'),undefined);
    assert.equal(r.ownedSession('s1','a').id,'s1');
    assert.equal(r.listActiveForAccount('a',now).length,2);
    r.touch('s1');
    r.revokeForAccount('a','s1');
    assert.equal(r.findActiveByTokenHash('h2',now),undefined);
    assert.ok(r.findActiveByTokenHash('h1',now));
    r.revokeByTokenHash('h1');
    assert.equal(r.findActiveByTokenHash('h1',now),undefined);
    r.revokeById('other');
    assert.equal(r.findActiveByTokenHash('h4',now),undefined);
    assert.throws(()=>createSessionRepository(null),/prepare/);
  } finally { db.close(); }
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
console.log('Session repository V26: LULUS (create, expiry, ownership, revoke, isolation)');
