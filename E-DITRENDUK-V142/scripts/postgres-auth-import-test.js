'use strict';
const assert=require('node:assert/strict');
const {importAuth,normalizeAccount}=require('./postgres-auth-import');
const user={id:'u1',username:'alfina',email:'alfina@example.org',password_hash:'hashed-secret',name:'Alfina',role:'Pegawai',status:'Aktif',unit:'DITRENDUK',permissions:'["beranda"]',must_change_password:1};
const reset={id:'r1',account_id:'u1',identity:'alfina',status:'Menunggu',requested_at:'2026-10-20 07:00:00'};
const db={prepare:sql=>({all:()=>sql.includes('password_reset_requests')?[reset]:[user]})};
function poolFactory({conflict=false}={}){
 const queries=[],client={query:async(sql,args=[])=>{
  queries.push({sql,args});
  if(sql==='SELECT id,username,email FROM accounts')return {rows:conflict?[{id:'other',username:'alfina',email:null}]:[]};
  if(sql==='SELECT id FROM password_reset_requests')return {rows:[]};
  return {rows:[],rowCount:1};
 },release(){}};
 return {pool:{connect:async()=>client},queries};
}
(async()=>{
 const logs=[];
 let x=poolFactory();await importAuth({db,pool:x.pool,log:s=>logs.push(s)});
 assert(x.queries.some(q=>q.sql==='ROLLBACK'));
 assert(!x.queries.some(q=>q.sql.includes('INSERT INTO accounts')));
 assert(logs.every(s=>!s.includes('hashed-secret')));
 x=poolFactory();await importAuth({db,pool:x.pool,apply:true,log:()=>{}});
 assert(x.queries.some(q=>q.sql==='COMMIT'));
 assert(x.queries.filter(q=>q.sql.includes('INSERT INTO')).length===2);
 assert(x.queries.some(q=>q.sql.includes('ON CONFLICT(id) DO NOTHING')));
 x=poolFactory({conflict:true});
 await assert.rejects(importAuth({db,pool:x.pool,apply:true,log:()=>{}}),/Konflik username/);
 assert(x.queries.some(q=>q.sql==='ROLLBACK'));
 assert.deepEqual(JSON.parse(normalizeAccount(user)[8]),['beranda']);
 console.log('PASS auth migration dry-run, safe import, conflicts, rollback and no password logs');
})().catch(e=>{console.error(e);process.exitCode=1});
