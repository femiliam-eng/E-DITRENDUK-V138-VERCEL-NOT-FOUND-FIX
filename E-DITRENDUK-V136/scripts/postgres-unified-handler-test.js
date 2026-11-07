'use strict';
const assert=require('node:assert/strict');
const {handle,allowed}=require('../backend/postgres-unified-handler');
const records=new Map();const queries=[];
const repo={
 list:async table=>[...records.values()].filter(x=>x.table===table).map(x=>({payload:x.payload})),
 get:async(table,id)=>{const x=records.get(table+':'+id);return x?{payload:x.payload}:null},
 create:async(table,id,payload)=>{records.set(table+':'+id,{table,payload});return {payload}},
 update:async(table,id,payload)=>{records.set(table+':'+id,{table,payload});return {payload}},
 patch:async(table,id,changes)=>{const old=records.get(table+':'+id);if(!old)return null;const payload={...old.payload,...changes};records.set(table+':'+id,{table,payload});return {payload}},
 remove:async(table,id)=>records.delete(table+':'+id)
};
const pool={query:async(sql,args)=>{queries.push({sql,args});return {rows:[]}}};
const admin={id:'admin',role:'Superadmin',status:'Aktif',permissions:[]};
const employee={id:'pegawai',role:'Pegawai',status:'Aktif',permissions:['monitoring','logbook']};
async function request(method,pathname,user,body){
 const res={};const json=(res,status,data)=>({status,data});
 return handle({req:{method},res,url:new URL('http://localhost'+pathname),user,repo,pool,json,readJson:async()=>body});
}
(async()=>{
 assert.equal(allowed(employee,'monitoring'),true);
 assert.equal(allowed(employee,'arsip'),false);
 assert.equal((await request('GET','/api/monitoring',null)).status,401);
 assert.equal((await request('GET','/api/archive',employee)).status,403);
 assert.equal((await request('POST','/api/monitoring',employee,{id:'m1',name:'Uji',status:'Awal'})).status,201);
 assert.equal((await request('PATCH','/api/monitoring/m1',employee,{status:'Selesai'})).data.data.name,'Uji');
 assert.equal((await request('GET','/api/monitoring',employee)).data.data[0].status,'Selesai');
 assert.equal((await request('GET','/api/monitoring?page=1&limit=1&q=Selesai',employee)).data.pagination.total,1);
 assert.equal((await request('POST','/api/monitoring',employee,{id:'m1'})).status,409);
 assert.equal((await request('GET','/api/bootstrap',employee)).data.data.archive.length,0);
 assert.equal((await request('GET','/api/dashboard',employee)).status,200);
 assert.equal((await request('GET','/api/audit',employee)).status,403);
 assert.equal((await request('GET','/api/audit',admin)).status,200);
 assert.equal((await request('DELETE','/api/monitoring/m1',employee)).status,200);
 assert.equal((await request('DELETE','/api/monitoring/m1',employee)).status,404);
 assert(queries.some(x=>x.sql.includes('INSERT INTO audit_logs')));
 assert(queries.some(x=>x.sql.includes('WHERE account_id=$1')));
 console.log('PASS unified PG: access control, CRUD, partial update, pagination, bootstrap, dashboard, audit');
})().catch(e=>{console.error(e);process.exitCode=1});
