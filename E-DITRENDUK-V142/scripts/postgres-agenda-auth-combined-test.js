'use strict';
const assert=require('node:assert/strict');
const {handle,normalize,permitted}=require('../backend/postgres-agenda-task-handler');
const superadmin={id:'admin',role:'Superadmin',status:'Aktif'};
const employee={id:'staff',role:'Pegawai',status:'Aktif',permissions:['task-deadline']};
const records=new Map();const repo={list:async()=>[...records.values()].map(payload=>({payload})),get:async(t,id)=>records.has(id)?{payload:records.get(id)}:null,create:async(t,id,p)=>{records.set(id,p)},update:async(t,id,p)=>{records.set(id,p)},remove:async(t,id)=>records.delete(id)};
const json=(res,status,body)=>({status,body});
async function call(method,path,user,body){return handle({req:{method},res:{},url:{pathname:path},user,repo,readJson:async()=>body,json})}
(async()=>{
 assert.equal(permitted(employee,'task-deadline'),true);
 assert.equal(permitted(employee,'agenda'),false);
 assert.equal(permitted({...employee,permissions:'["task-deadline"]'},'task-deadline'),true);
 assert.equal((await call('GET','/api/task-deadline',null)).status,401);
 assert.equal((await call('GET','/api/agenda',employee)).status,403);
 let r=await call('POST','/api/task-deadline',employee,{tugas:'Cek dokumen',deadline:'2026-10-21',status:'not yet'});
 assert.equal(r.status,201);const id=r.body.data.id;
 r=await call('PATCH','/api/task-deadline/'+id,employee,{status:'done'});
 assert.equal(r.status,200);assert.equal(r.body.data.tugas,'Cek dokumen');
 assert.equal((await call('GET','/api/task-deadline',employee)).body.data[0].status,'done');
 assert.equal((await call('PATCH','/api/task-deadline/'+id,employee,{status:'pending'})).status,400);
 assert.equal((await call('PATCH','/api/task-deadline/'+id,employee,{deadline:'2026-02-30'})).status,400);
 assert.equal(records.get(id).status,'done');
 assert.equal((await call('DELETE','/api/task-deadline/'+id,employee)).status,200);
 assert.equal((await call('POST','/api/agenda',superadmin,{kegiatan:'Rapat',tanggal:'2026-11-01'})).status,201);
 assert.equal((await call('GET','/api/agenda',superadmin)).status,200);
 assert.equal(normalize('agenda',{kegiatan:'x',tanggal:'2025-01-01',hasilKegiatan:'Hasil rapat'},{},'x').hasilKegiatan,'Hasil rapat');
 assert.throws(()=>normalize('agenda',{kegiatan:'x',tanggal:'2025-02-30'},{},'x'),/Tanggal/);
 console.log('PASS combined PG auth/agenda/task handler: roles, CRUD, partial PATCH, validation');
})().catch(e=>{console.error(e);process.exitCode=1});
