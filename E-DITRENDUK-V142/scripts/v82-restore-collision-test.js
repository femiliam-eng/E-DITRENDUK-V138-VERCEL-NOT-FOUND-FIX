'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {backup}=require('./supabase-storage-backup');
const {restore}=require('./supabase-backup-restore');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'editrenduk-v82-'));
 const env={SUPABASE_URL:'https://test.supabase.co/',SUPABASE_SERVICE_ROLE_KEY:'test',SUPABASE_STORAGE_BUCKET:'notulen-private',BACKUP_ENCRYPTION_PASSPHRASE:'long-staging-test-secret-passphrase-123',BACKUP_OUTPUT_DIR:tmp,RESTORE_TARGET_BUCKET:'notulen-test',RESTORE_CONFIRM:'RESTORE_TO_notulen-test',NODE_ENV:'test'};
 try{
  const folder=await backup({env,fetchImpl:async(url)=>String(url).includes('/object/list/')?{ok:true,json:async()=>[{name:'one.pdf'}]}:{ok:true,arrayBuffer:async()=>Buffer.from('test PDF')}});
  let writes=0;
  await assert.rejects(restore(folder,{env,fetchImpl:async(url,options)=>{
   if(String(url).includes('/object/list/'))return {ok:true,json:async()=>[{name:'one.pdf'}]};
   writes++;return {ok:true};
  },logger:()=>{}}),/sudah ada/);
  assert.equal(writes,0);
  console.log('PASS V82: staging object collision aborts before any upload');
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
