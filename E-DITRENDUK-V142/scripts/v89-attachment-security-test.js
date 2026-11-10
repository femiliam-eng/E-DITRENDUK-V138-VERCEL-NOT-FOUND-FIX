'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../server.js'),'utf8');
assert.match(source,/agendaAttachmentHandlers=new Map\(\)/);
assert.match(source,/getAgendaAttachmentHandler\(repo,storage\)\(\{req,res,url,user,readJson,json\}\)/);
const {createHandler}=require('../backend/agenda-attachments');
const row={id:'a',attachments:[{id:'att_1',key:'att_1.docx',extension:'docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',fileName:'confidential.docx'}]};
const handler=createHandler({repo:{get:async()=>({payload:JSON.stringify(row)})},storage:{get:async()=>Buffer.from('test')}});
async function call(method,path){const res={status:0,headers:{},setHeader(k,v){this.headers[k]=v},writeHead(s,h){this.status=s;this.headers={...this.headers,...h}},end(x){this.body=x}};await handler({req:{method},res,url:new URL('https://example.org'+path),user:{status:'Aktif',role:'Superadmin'},json:(r,s,obj)=>{r.status=s;r.body=obj}});return res}
(async()=>{
 const list=await call('GET','/api/agenda/a/attachments');assert.equal(list.status,200);assert.equal(list.body.data[0].key,undefined);assert.equal(list.headers['Cache-Control'],'no-store');
 const file=await call('GET','/api/agenda/a/attachments/att_1/file');assert.match(file.headers['Content-Disposition'],/^attachment;/);assert.equal(file.headers['X-Content-Type-Options'],'nosniff');
 assert.equal((await call('PUT','/api/agenda/a/attachments')).status,405);
 console.log('PASS V89: persistent handler wiring, private storage keys hidden, safe DOCX download, method rejection');
})().catch(e=>{console.error(e);process.exitCode=1});
