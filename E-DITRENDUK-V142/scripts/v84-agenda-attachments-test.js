'use strict';
const assert=require('node:assert/strict');
const {parseUpload,createHandler}=require('../backend/agenda-attachments');
const bytes=Buffer.from('%PDF-1.7 test');
const body={fileName:'Undangan.pdf',mimeType:'application/pdf',type:'Surat Undangan',fileBase64:bytes.toString('base64')};
assert.equal(parseUpload(body).extension,'pdf');
for(const bad of [{...body,fileName:'../secret.pdf'},{...body,type:'Other'},{...body,mimeType:'text/plain'},{...body,fileBase64:Buffer.from('invalid').toString('base64')}])
 assert.throws(()=>parseUpload(bad));
(async()=>{
 const row={id:'agd_test',kegiatan:'Rapat',attachments:[]};
 let uploads=0;
 const repo={get:async()=>({payload:JSON.stringify(row)}),update:async(t,id,p)=>Object.assign(row,p)};
 const storage={put:async()=>{uploads++},get:async()=>bytes,remove:async()=>{}};
 const handle=createHandler({repo,storage});
 const user={id:'u1',status:'Aktif',role:'Pegawai',permissions:['agenda']};
 async function call(method,path,who=user,data=body){
  const response={status:0,payload:null,writeHead(status){this.status=status},end(value){this.payload=value}};
  const json=(res,status,obj)=>{res.status=status;res.payload=obj;return obj};
  await handle({req:{method},res:response,url:new URL('http://localhost'+path),user:who,readJson:async()=>data,json});
  return response;
 }
 const endpoint='/api/agenda/agd_test/attachments';
 assert.equal((await call('POST',endpoint,{...user,permissions:[]})).status,403);
 assert.equal(uploads,0);
 assert.equal((await call('POST',endpoint)).status,201);
 assert.equal(row.attachments.length,1);
 assert.equal((await call('GET',endpoint)).payload.data.length,1);
 assert.equal((await call('DELETE',endpoint+'/'+row.attachments[0].id)).status,200);
 assert.equal(row.attachments.length,0);
 row.attachments=Array.from({length:5},(_,i)=>({id:'x'+i}));
 assert.equal((await call('POST',endpoint)).status,400);
 console.log('PASS V84: file validation, permission, upload, listing, removal, max 5');
})().catch(e=>{console.error(e);process.exitCode=1});
