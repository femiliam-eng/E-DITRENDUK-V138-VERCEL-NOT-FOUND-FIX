'use strict';
const assert=require('node:assert/strict');
const {handle}=require('../backend/postgres-admin-accounts');
const admin={id:'admin',role:'Superadmin',status:'Aktif'};
const base={id:'u1',username:'user1',email:null,name:'User One',role:'Pegawai',status:'Aktif',unit:'DITRENDUK',permissions:['beranda'],must_change_password:false};
function make(body={},count=2){const queries=[],client={query:async(sql,args=[])=>{
 queries.push({sql,args});
 if(sql.includes('SELECT count(*)'))return {rows:[{n:count}]};
 if(sql.includes('SELECT')&&sql.includes('FOR UPDATE'))return {rows:[{...base,role:'Superadmin'}]};
 if(sql.includes('UPDATE accounts')||sql.includes('INSERT INTO accounts'))return {rows:[base]};
 if(sql.includes('SELECT id,username,email,name,role,status,unit,permissions'))return {rows:[base]};
 return {rows:[],rowCount:1};
 },release(){}};const pool={connect:async()=>client,query:client.query};
 const res={};const json=(_,status,body)=>({status,body});
 const run=(method,path,user=admin)=>handle({req:{method},res,url:{pathname:path},user,pool,readJson:async()=>body,json,uid:()=> 'audit1',hashPassword:()=> 'hash',validPassword:x=>String(x||'').length>=10});
 return {run,queries};}
(async()=>{
 let x=make();assert.equal((await x.run('GET','/api/accounts',{id:'p',role:'Pegawai',status:'Aktif'})).status,403);
 x=make();const list=await x.run('GET','/api/accounts');assert.equal(list.status,200);assert.equal(list.body.data[0].password_hash,undefined);
 x=make({name:'New User',username:'newuser',password:'Password123',permissions:['beranda','beranda','invalid']});const created=await x.run('POST','/api/accounts');assert.equal(created.status,201);assert(x.queries.some(q=>q.sql.includes('INSERT INTO accounts')));assert(!JSON.stringify(created).includes('hash'));
 x=make({status:'Nonaktif'},1);const rejected=await x.run('PATCH','/api/accounts/u1');assert.equal(rejected.status,409);assert(x.queries.some(q=>q.sql==='ROLLBACK'));
 x=make({role:'Pegawai'},2);assert.equal((await x.run('PATCH','/api/accounts/u1')).status,200);assert(x.queries.some(q=>q.sql.includes('UPDATE auth_sessions')));
 x=make({password:'Password123'});assert.equal((await x.run('POST','/api/accounts/u1/reset-password')).status,200);assert(x.queries.some(q=>q.sql.includes('UPDATE auth_sessions')));
 x=make({role:'GodMode'});assert.equal((await x.run('PATCH','/api/accounts/u1')).status,400);
 console.log('PASS PostgreSQL Superadmin accounts: RBAC, create, update, last admin, revoke, reset, validation');
})().catch(e=>{console.error(e);process.exitCode=1});
