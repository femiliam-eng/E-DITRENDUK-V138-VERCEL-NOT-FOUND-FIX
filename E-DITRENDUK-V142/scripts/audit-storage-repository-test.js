'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {openDatabase}=require('../backend/database');
const {createAuditRepository}=require('../backend/audit-repository');
const {createStorageRepository}=require('../backend/storage-repository');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'editrenduk-v28-'));
try {
 const db=openDatabase({dataDir:dir});
 try {
  db.exec(`CREATE TABLE accounts(id TEXT PRIMARY KEY,name TEXT,username TEXT);
    CREATE TABLE audit_logs(id TEXT PRIMARY KEY,account_id TEXT,action TEXT,resource TEXT,resource_id TEXT,detail TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE storage_files(id TEXT PRIMARY KEY,resource TEXT,resource_id TEXT,file_name TEXT,stored_path TEXT UNIQUE,mime_type TEXT,size_bytes INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
  db.prepare('INSERT INTO accounts(id,name,username) VALUES(?,?,?)').run('a','Admin','admin');
  const a=createAuditRepository(db),st=createStorageRepository(db);
  a.record({id:'l1',accountId:'a',action:'CREATE',resource:'notulen',resourceId:'n1',detail:{x:1}});
  a.record({id:'l2',accountId:'a',action:'DELETE',resource:'archive',resourceId:'ar1',detail:{}});
  assert.equal(a.search().pagination.total,2);
  assert.equal(a.search({action:'CREATE'}).rows[0].resource,'notulen');
  assert.equal(a.search({resource:'archive'}).pagination.total,1);
  assert.equal(a.search({q:'Admin'}).pagination.total,2);
  assert.equal(a.search({q:'ar1'}).pagination.total,1);
  assert.equal(a.search({page:100}).rows.length,0);
  assert.equal(a.recentByAccount('a',1).length,1);
  st.save({id:'f1',resource:'notulen',resourceId:'n1',fileName:'a.png',storedPath:'/uploads/notulen/a.png',mimeType:'image/png',sizeBytes:42});
  assert.equal(st.list().length,1);
  assert.equal(st.usage()[0].size_bytes,42);
  assert.equal(st.removeByResource('notulen','wrong').changes,0);
  assert.equal(st.removeByPath('/uploads/notulen/a.png').changes,1);
  st.save({id:'f2',resource:'notulen',resourceId:'n1',fileName:'b.png',storedPath:'/uploads/notulen/b.png',mimeType:'image/png',sizeBytes:7});
  assert.equal(st.removeByResource('notulen','n1').changes,1);
  assert.throws(()=>createAuditRepository(null),/prepare/);
  assert.throws(()=>createStorageRepository(null),/prepare/);
 }finally{db.close();}
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('Audit & storage repository V28: LULUS');
