'use strict';
const assert=require('node:assert/strict');
const {assess}=require('./postgres-full-migration-gate');
const clean=assess('const pool = createPool();');
assert.equal(clean.ready,true);
const bad=assess('const db=openDatabase(); db.prepare("SELECT 1"); createAccountRepository(db); if(PG_PRIMARY_AUTH){} ALLOW_SQLITE_PUBLIC');
assert.equal(bad.ready,false);
for(const id of ['sqlite-runtime-open','sqlite-query','legacy-repositories','hybrid-fallback','sqlite-production-bypass'])assert.ok(bad.findings.find(f=>f.id===id).occurrences>0,id);
console.log('PostgreSQL full migration gate tests PASS');
