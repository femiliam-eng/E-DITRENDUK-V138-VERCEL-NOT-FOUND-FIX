'use strict';
const assert=require('node:assert/strict');
const {handle,allowed}=require('../backend/postgres-unified-handler');
const users=[
 {id:'emp',role:'Pegawai',status:'Aktif',permissions:['pengguna','monitoring']},
 {id:'admin',role:'Admin',status:'Aktif',permissions:['pengguna','monitoring']},
 {id:'root',role:'Superadmin',status:'Aktif',permissions:[]},
 {id:'off',role:'Superadmin',status:'Nonaktif',permissions:[]}
];
const writes=[];
const repo={list:async()=>[{id:'u1',payload:{id:'u1',name:'Example'}}],get:async()=>({payload:{id:'u1',name:'Example'}}),create:async(...args)=>writes.push(['create',...args]),update:async(...args)=>writes.push(['update',...args]),remove:async(...args)=>{writes.push(['remove',...args]);return true}};
const pool={query:async()=>({rows:[]})};
async function request(user,method,pathname,body={}){
 let response;
 await handle({req:{method},res:{},url:new URL('http://localhost'+pathname),user,repo,pool,readJson:async()=>body,json:(_res,status,data)=>{response={status,data};return response}});
 return response;
}
(async()=>{
 assert.equal(allowed(users[0],'pengguna'),false);
 assert.equal(allowed(users[1],'pengguna'),false);
 assert.equal(allowed(users[2],'pengguna'),true);
 assert.equal(allowed(users[3],'pengguna'),false);
 for(const user of [users[0],users[1],users[3]]){
  assert.equal((await request(user,'GET','/api/users')).status,403);
  assert.equal((await request(user,'GET','/api/bootstrap')).data.data.users.length,0);
 }
 assert.equal((await request(users[2],'GET','/api/users')).status,200);
 for(const method of ['POST','PATCH','PUT','DELETE']){
  const endpoint=method==='POST'?'/api/users':'/api/users/u1';
  assert.equal((await request(users[2],method,endpoint,{role:'Superadmin',permissions:['pengguna']})).status,403);
 }
 assert.equal(writes.length,0,'No generic users mutation must reach persistence');
 assert.equal((await request(users[0],'GET','/api/monitoring')).status,200);
 assert.equal((await request(users[0],'GET','/api/audit')).status,403);
 assert.equal((await request(users[2],'GET','/api/audit')).status,200);
 console.log('PASS PG authorization: account directory protected, generic user mutation blocked, bootstrap redacted, audit guarded');
})().catch(e=>{console.error(e);process.exitCode=1});
