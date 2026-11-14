'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {openDatabase}=require('../backend/database');
const {createAccountRepository}=require('../backend/account-repository');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'editrenduk-v27-'));
try {
 const db=openDatabase({dataDir:dir});
 try {
  db.exec(`CREATE TABLE accounts(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,email TEXT,password_hash TEXT,name TEXT,role TEXT,status TEXT,unit TEXT,permissions TEXT,must_change_password INTEGER,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE password_reset_requests(id TEXT PRIMARY KEY,account_id TEXT,identity TEXT,status TEXT DEFAULT 'Menunggu',requested_at TEXT DEFAULT CURRENT_TIMESTAMP,resolved_at TEXT,resolved_by TEXT);`);
  const r=createAccountRepository(db);
  r.create({id:'a1',username:'tester',email:'t@example.org',passwordHash:'hash1',name:'Tester',role:'Pegawai',status:'Aktif',unit:'DITRENDUK',permissions:'[]',mustChangePassword:1});
  assert.equal(r.byIdentity('tester').id,'a1');
  assert.equal(r.byIdentity('t@example.org').id,'a1');
  assert.equal(r.activeIdentity('tester').id,'a1');
  assert.ok(r.byUsername('tester'));
  assert.equal(r.list().length,1);
  r.update({id:'a1',name:'Tester Baru',email:'t@example.org',role:'Superadmin',status:'Aktif',unit:'Unit',permissions:'["audit"]'});
  assert.equal(r.byId('a1').name,'Tester Baru');
  r.setPassword('a1','hash2',false);
  assert.equal(r.byId('a1').must_change_password,0);
  r.requestReset('req1','a1','tester');
  assert.equal(r.pendingReset('a1').id,'req1');
  assert.equal(r.pendingResetById('req1').account_id,'a1');
  assert.equal(r.resetRequests().length,1);
  assert.equal(r.resolveReset('req1','admin').changes,1);
  assert.equal(r.resolveReset('req1','admin').changes,0);
  assert.equal(r.pendingReset('a1'),undefined);
  r.setPassword('a1','hash3',true);
  assert.equal(r.byId('a1').must_change_password,1);
  assert.throws(()=>createAccountRepository(null),/prepare/);
 } finally {db.close();}
} finally {fs.rmSync(dir,{recursive:true,force:true});}
console.log('Account repository V27: LULUS (CRUD, identity, reset, password)');
