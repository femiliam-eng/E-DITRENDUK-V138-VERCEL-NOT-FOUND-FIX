'use strict';
const assert=require('node:assert/strict');
const {createPostgresAccountRepository}=require('../backend/postgres-account-repository');
(async()=>{
  const calls=[];
  const pool={query:async(sql,params=[])=>{calls.push({sql,params});return {rows:[{id:'a',username:'pegawai'}],rowCount:1};}};
  const repo=createPostgresAccountRepository(pool);
  assert.equal((await repo.byUsername('PEGAWAI')).id,'a');
  assert.deepEqual(calls[0].params,['PEGAWAI']);
  await repo.byId('a');await repo.list();
  assert.equal(await repo.setPasswordHash('a','scrypt:test',true),true);
  assert.deepEqual(calls[3].params,['a','scrypt:test',true]);
  assert.equal(await repo.setStatus('a','Nonaktif'),true);
  await assert.rejects(()=>repo.setStatus('a','ADMIN'),RangeError);
  assert.equal(calls.length,5);
  assert.ok(calls.every(c=>!c.sql.includes('PEGAWAI')));
  assert.throws(()=>createPostgresAccountRepository(null),TypeError);
  console.log('V33 PostgreSQL account adapter self-test LULUS');
})().catch(e=>{console.error(e);process.exitCode=1});
