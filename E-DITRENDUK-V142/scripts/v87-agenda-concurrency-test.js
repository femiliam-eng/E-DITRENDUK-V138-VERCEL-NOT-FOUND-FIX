'use strict';
const assert=require('node:assert/strict');
const {createHandler}=require('../backend/agenda-attachments');
const bytes=Buffer.from('%PDF-1.7 fixture');
const upload={fileName:'Surat.pdf',mimeType:'application/pdf',type:'Surat Undangan',fileBase64:bytes.toString('base64')};
let row={id:'agenda1',attachments:[]};let updates=0,uploaded=0;
const repo={get:async()=>({payload:JSON.stringify(row)}),update:async(_,id,payload)=>{await new Promise(r=>setTimeout(r,8));row=payload;updates++}};
const storage={put:async()=>{uploaded++},remove:async()=>{},get:async()=>bytes};
const handler=createHandler({repo,storage});
async function request(method='POST',id='agenda1'){
 const res={status:0,payload:null,writeHead(n){this.status=n},end(x){this.payload=x}};
 await handler({req:{method},res,url:new URL('http://localhost/api/agenda/'+id+'/attachments'),user:{status:'Aktif',role:'Superadmin'},readJson:async()=>upload,json:(r,n,x)=>{r.status=n;r.payload=x;return x}});
 return res;
}
(async()=>{
 const results=await Promise.all(Array.from({length:8},()=>request()));
 assert.equal(results.filter(r=>r.status===201).length,5);
 assert.equal(results.filter(r=>r.status===400).length,3);
 assert.equal(row.attachments.length,5);
 assert.equal(new Set(row.attachments.map(x=>x.id)).size,5);
 assert.equal(updates,5);assert.equal(uploaded,5);
 console.log('PASS V87: concurrent uploads serialized, five-file limit respected, no lost updates');
})().catch(e=>{console.error(e);process.exitCode=1});
