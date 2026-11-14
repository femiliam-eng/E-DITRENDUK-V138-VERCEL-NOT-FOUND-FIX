'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { openDatabase } = require('../backend/database');
const { createPayloadRepository, ALLOWED_TABLES } = require('../backend/payload-repository');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'editrenduk-v25-'));
try {
  const db = openDatabase({dataDir:dir});
  try {
    for (const table of ALLOWED_TABLES) db.exec(`CREATE TABLE ${table}(id TEXT PRIMARY KEY,payload TEXT NOT NULL,updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
    const repo = createPayloadRepository(db);
    assert.deepEqual(repo.list('monitoring'), []);
    repo.save('monitoring','abc',{name:'awal', count:1});
    assert.deepEqual(repo.list('monitoring'), [{name:'awal',count:1}]);
    repo.save('monitoring','abc',{name:'baru'});
    assert.deepEqual(repo.list('monitoring'), [{name:'baru'}]);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM monitoring').get().c,1);
    repo.save('logbook','abc',{name:'lain'});
    assert.deepEqual(repo.list('logbook'),[{name:'lain'}]);
    for (const bad of ['accounts','monitoring; DROP TABLE monitoring','unknown','__proto__']) {
      assert.throws(()=>repo.list(bad),/tidak diizinkan/);
      assert.throws(()=>repo.save(bad,'x',{}),/tidak diizinkan/);
    }
    assert.throws(()=>repo.save('monitoring','',{}),/wajib diisi/);
    assert.throws(()=>createPayloadRepository(null),/prepare/);
  } finally { db.close(); }
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
console.log('Payload repository V25: LULUS (CRUD, upsert, isolasi tabel, whitelist)');
