'use strict';
const assert=require('node:assert/strict');
const {apply,plan,main,checkSQL}=require('./v123-safe-postgres-migrate');
const {REQUIRED_TABLES,REQUIRED_COLUMNS}=require('../backend/postgres-production-readiness');
function mock({tables=[],missing=[],failAt=null}={}){
 let calls=[];
 const client={query:async(sql,args)=>{
  calls.push(String(sql));
  if(failAt&&String(sql).includes(failAt))throw Error('simulated migration failure');
  if(String(sql).includes('FROM pg_catalog.pg_tables'))return {rows:tables.map(tablename=>({tablename}))};
  if(String(sql).includes('WITH missing_tables')){
   assert.deepEqual(args,[REQUIRED_TABLES,REQUIRED_COLUMNS]);
   return {rows:missing.map(name=>({name}))};
  }
  return {rows:[]};
 }};return {client,calls};
}
(async()=>{
 const p=plan();assert(p.upgrades.includes('postgres/migrations/v123-fasilitasi.sql'));
 assert.throws(()=>checkSQL('bad','DELETE FROM accounts'),/Unsafe/);
 assert.throws(()=>checkSQL('bad','DROP TABLE accounts'),/Unsafe/);
 let a=mock();let r=await apply(a.client);assert.equal(r.mode,'fresh');
 assert(a.calls.some(s=>s.includes('CREATE TABLE accounts')));
 assert(a.calls.some(s=>s.includes('CREATE TABLE IF NOT EXISTS fasilitasi')));
 assert.equal(a.calls.filter(s=>s==='COMMIT').length,1,'exactly one outer COMMIT');
 assert(!a.calls.slice(0,-1).some(s=>/\bCOMMIT\s*;/i.test(s)),'legacy migration cannot commit early');
 assert.equal(a.calls.at(-1),'COMMIT');
 a=mock({tables:['accounts','monitoring','auth_sessions']});r=await apply(a.client);assert.equal(r.mode,'upgrade');
 assert(!a.calls.some(s=>s.includes('CREATE TABLE accounts (')),'must not rerun baseline on existing data');
 a=mock({tables:['accounts']});await assert.rejects(apply(a.client),/parsial/);assert.equal(a.calls.at(-1),'ROLLBACK');
 a=mock({tables:['accounts','monitoring','auth_sessions'],missing:['accounts.password_hash']});await assert.rejects(apply(a.client),/accounts.password_hash/);assert.equal(a.calls.at(-1),'ROLLBACK');
 a=mock({failAt:'CREATE TABLE IF NOT EXISTS fasilitasi'});await assert.rejects(apply(a.client),/simulated/);assert.equal(a.calls.at(-1),'ROLLBACK');
 await assert.rejects(main(['--apply'],{}),/DATABASE_URL/);
 await assert.rejects(main(['--apply'],{DATABASE_URL:'postgresql://user:password@db.example/app'}),/CONFIRM_DATABASE_MIGRATION/);
 console.log('PASS V123 safe migrations: fresh, upgrade, partial reject, missing-column rollback, SQL failure rollback, target confirmation');
})().catch(e=>{console.error(e);process.exitCode=1});
