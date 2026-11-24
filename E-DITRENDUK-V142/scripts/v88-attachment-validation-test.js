'use strict';
const assert=require('node:assert/strict');
const {parseUpload,createHandler}=require('../backend/agenda-attachments');
const base={fileName:'surat.pdf',mimeType:'application/pdf',type:'Surat Undangan',fileBase64:Buffer.from('%PDF-test').toString('base64')};
assert.equal(parseUpload(base).extension,'pdf');
for(const malformed of ['QQ==AAAA','QQ=','AAAA=','/w==','A==='])assert.throws(()=>parseUpload({...base,fileBase64:malformed}));
(async()=>{
const row={id:'a1',attachments:[{id:'att_1',key:'att_1.pdf',mimeType:'application/pdf',extension:'pdf'}]};
let deleted=false;
const handler=createHandler({repo:{get:async()=>({payload:JSON.stringify(row)}),update:async()=>{}},storage:{get:async()=>Buffer.from('test'),remove:async()=>{deleted=true;throw Error('offline')}}});
const user={status:'Aktif',role:'Superadmin'};
async function request(method,path){const res={status:0,writeHead(s){this.status=s},end(){}};const json=(r,s,obj)=>{r.status=s;r.data=obj};await handler({req:{method},res,url:new URL('https://local'+path),user,json});return res}
assert.equal((await request('GET','/api/agenda/a1/attachments/att_1')).status,404);
assert.equal((await request('DELETE','/api/agenda/a1/attachments/att_1')).status,200);
assert.ok(deleted);
console.log('PASS V88 attachment validation and cleanup error reporting');
})().catch(e=>{console.error(e);process.exitCode=1});
