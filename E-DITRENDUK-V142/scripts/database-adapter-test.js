'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { normalizeDriver, openDatabase } = require('../backend/database');
assert.equal(normalizeDriver(), 'sqlite');
assert.equal(normalizeDriver(' SQLITE '), 'sqlite');
for (const driver of ['postgres', 'mysql', 'unknown']) {
  assert.throws(() => normalizeDriver(driver), /belum didukung/);
}
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'editrenduk-v24-'));
try {
  assert.throws(() => openDatabase({driver:'postgres',dataDir:dir}), /belum didukung/);
  assert.equal(fs.readdirSync(dir).length, 0, 'driver tidak didukung tidak boleh membuat SQLite');
  const db = openDatabase({driver:'sqlite',dataDir:dir});
  try {
    assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
    db.exec('CREATE TABLE adapter_probe (id TEXT PRIMARY KEY, value TEXT)');
    db.prepare('INSERT INTO adapter_probe VALUES (?,?)').run('one','ok');
    assert.equal(db.prepare('SELECT value FROM adapter_probe WHERE id=?').get('one').value,'ok');
  } finally { db.close(); }
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
console.log('Database adapter V24: LULUS (guard, PRAGMA, CRUD SQLite)');
