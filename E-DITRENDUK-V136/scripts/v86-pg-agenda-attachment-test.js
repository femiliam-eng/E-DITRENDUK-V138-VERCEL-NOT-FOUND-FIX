'use strict';
const assert=require('node:assert/strict');
const {handle}=require('../backend/postgres-agenda-task-handler');
(async()=>{
 let stored={id:'agd_1',kegiatan:'Rapat Lama',tanggal:'2026-10-26',attachments:[{id:'att_1',key:'att_1.pdf',fileName:'Surat.pdf'}]};
 const repo={get:async()=>({payload:JSON.stringify(stored)}),update:async(_table,_id,payload)=>{stored=payload}};
 const res={status:0,body:null};
 const json=(_res,status,body)=>{res.status=status;res.body=body};
 await handle({req:{method:'PUT'},res,url:new URL('http://localhost/api/agenda/agd_1'),user:{id:'u1',status:'Aktif',role:'Superadmin'},repo,readJson:async()=>({kegiatan:'Rapat Baru',tanggal:'2026-10-27',attachments:[]}),json});
 assert.equal(res.status,200);assert.equal(stored.kegiatan,'Rapat Baru');assert.equal(stored.attachments.length,1);assert.equal(stored.attachments[0].id,'att_1');
 console.log('PASS V86: PostgreSQL agenda update preserves server-controlled attachment metadata');
})().catch(e=>{console.error(e);process.exitCode=1});
