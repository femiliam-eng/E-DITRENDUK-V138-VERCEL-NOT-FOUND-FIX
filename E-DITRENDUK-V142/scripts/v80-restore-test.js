'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {backup}=require('./supabase-storage-backup');
const {plan,restore}=require('./supabase-backup-restore');
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'editrenduk-restore-'));
 const env={SUPABASE_URL:'https://test.supabase.co/',SUPABASE_SERVICE_ROLE_KEY:'test',SUPABASE_STORAGE_BUCKET:'notulen-private',BACKUP_ENCRYPTION_PASSPHRASE:'very-long-private-backup-passphrase-123',BACKUP_OUTPUT_DIR:root,RESTORE_TARGET_BUCKET:'notulen-restore-staging'};
 const fixture=Buffer.from('%PDF-1.7 fake staging fixture');
 const sourceFetch=async(url)=>new URL(url).pathname.includes('/object/list/')?{ok:true,json:async()=>[{name:'fixture.pdf'}]}:{ok:true,arrayBuffer:async()=>fixture};
 try{
  const folder=await backup({env,fetchImpl:sourceFetch});
  assert.equal(plan(folder,{env}).objects.length,1);
  assert.throws(()=>plan(folder,{env:{...env,RESTORE_TARGET_BUCKET:'notulen-private'}}),/berbeda/);
  assert.throws(()=>plan(folder,{env:{...env,RESTORE_TARGET_BUCKET:'notulen-live'}}),/berakhiran/);
  const calls=[];
  const targetFetch=async(url,options)=>{if(String(url).includes('/object/list/'))return {ok:true,json:async()=>[]};calls.push({url:String(url),options});return {ok:true}};
  const dry=await restore(folder,{env,fetchImpl:targetFetch,logger:()=>{}});
  assert.equal(dry.dryRun,true);assert.equal(calls.length,0);
  const confirmed={...env,RESTORE_CONFIRM:'RESTORE_TO_notulen-restore-staging',NODE_ENV:'test'};
  await assert.rejects(restore(folder,{env:{...confirmed,NODE_ENV:'production'},fetchImpl:targetFetch,logger:()=>{}}),/production/);
  const done=await restore(folder,{env:confirmed,fetchImpl:targetFetch,logger:()=>{}});
  assert.equal(done.count,1);assert.equal(calls.length,1);
  assert.equal(calls[0].options.headers['x-upsert'],'false');
  assert.equal(calls[0].options.method,'POST');
  assert.deepEqual(calls[0].options.body,fixture);
  console.log('PASS V80: dry-run, staging-only, explicit confirmation, no overwrite, verified restore');
 }finally{fs.rmSync(root,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
