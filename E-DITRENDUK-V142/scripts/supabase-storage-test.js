'use strict';
const assert=require('node:assert/strict');
const {createSupabaseStorage}=require('../backend/supabase-storage');
(async()=>{
 const calls=[],content=Buffer.from('%PDF-test');
 const storage=createSupabaseStorage({url:'https://example.supabase.co/',key:'test-only',bucket:'notulen-private',fetchImpl:async(url,options)=>{
  calls.push({url,options});
  return {ok:true,status:200,arrayBuffer:async()=>content};
 }});
 await storage.put('hasilnotulen_1.pdf',content,'application/pdf');
 assert.equal((await storage.get('hasilnotulen_1.pdf')).toString(),content.toString());
 await storage.remove('hasilnotulen_1.pdf');
 assert.deepEqual(calls.map(x=>x.options.method),['POST','GET','DELETE']);
 assert(calls.every(x=>x.url.includes('/storage/v1/object/notulen-private/hasilnotulen_1.pdf')));
 assert(calls.every(x=>x.options.headers.Authorization==='Bearer test-only'));
 await assert.rejects(storage.get('../secret.pdf'),/Object key/);
 assert.throws(()=>createSupabaseStorage({url:'http://example.com',key:'secret'}),/HTTPS/);
 const failed=createSupabaseStorage({url:'https://example.supabase.co/',key:'secret',fetchImpl:async()=>({ok:false,status:403})});
 await assert.rejects(failed.get('a.pdf'),/HTTP 403/);
 console.log('PASS private Supabase Storage upload/download/delete, auth headers, key validation, fail-closed');
})().catch(e=>{console.error(e);process.exitCode=1});
