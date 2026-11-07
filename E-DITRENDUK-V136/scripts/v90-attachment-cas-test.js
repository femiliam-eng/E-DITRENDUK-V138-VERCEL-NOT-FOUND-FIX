'use strict';
const assert=require('node:assert/strict');
const {createPostgresPayloadRepository}=require('../backend/postgres-payload-repository');
const {createHandler}=require('../backend/agenda-attachments');
const body={fileName:'Surat.pdf',mimeType:'application/pdf',type:'Surat Undangan',fileBase64:Buffer.from('%PDF-1.7 test').toString('base64')};
(async()=>{
 let state={id:'a',attachments:[]},removed=0;
 const pool={query:async(sql,params)=>{
  assert.match(sql,/WHERE id=\$1 AND payload=\$2::jsonb/);
  if(JSON.stringify(state)!==JSON.stringify(JSON.parse(params[1])))return {rows:[]};
  state=JSON.parse(params[2]);return {rows:[{id:'a',payload:state}]};
 }};
 const pg=createPostgresPayloadRepository(pool);
 const storage={put:async()=>{},remove:async()=>{removed++},get:async()=>Buffer.from('%PDF-1.7 test')};
 function handler(){return createHandler({repo:{get:async()=>({payload:structuredClone(state)}),updateIfUnchanged:pg.updateIfUnchanged},storage})}
 async function request(h,method,path){const res={status:0};await h({req:{method},res,url:new URL('http://localhost'+path),user:{role:'Superadmin',status:'Aktif'},readJson:async()=>body,json:(r,s,b)=>{r.status=s;r.body=b}});return res}
 const h1=handler(),h2=handler();
 const [a,b]=await Promise.all([request(h1,'POST','/api/agenda/a/attachments'),request(h2,'POST','/api/agenda/a/attachments')]);
 assert.deepEqual([a.status,b.status].sort(),[201,409]);
 assert.equal(state.attachments.length,1);assert.equal(removed,1);
 assert.equal((await request(h1,'DELETE','/api/agenda/a/attachments/'+state.attachments[0].id)).status,200);
 assert.equal(state.attachments.length,0);assert.equal(removed,2);
 console.log('PASS V90: PostgreSQL compare-and-swap prevents cross-instance lost updates, conflict rollback, deletion');
})().catch(e=>{console.error(e);process.exitCode=1});
