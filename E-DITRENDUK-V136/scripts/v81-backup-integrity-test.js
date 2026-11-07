'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {backup}=require('./supabase-storage-backup');
const {verify}=require('./supabase-backup-verify');
const {restore}=require('./supabase-backup-restore');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'editrenduk-v81-'));
 const env={SUPABASE_URL:'https://test.supabase.co/',SUPABASE_SERVICE_ROLE_KEY:'test',SUPABASE_STORAGE_BUCKET:'notulen-private',BACKUP_ENCRYPTION_PASSPHRASE:'v81-long-backup-passphrase-for-testing',BACKUP_OUTPUT_DIR:tmp,RESTORE_TARGET_BUCKET:'notulen-test',RESTORE_CONFIRM:'RESTORE_TO_notulen-test',NODE_ENV:'test'};
 const fetchImpl=async(url)=>String(url).includes('/object/list/')?{ok:true,json:async()=>[{name:'one.pdf'},{name:'two.pdf'}]}:{ok:true,arrayBuffer:async()=>Buffer.from('fixture')};
 try{
  const folder=await backup({env,fetchImpl});
  assert.equal(verify(folder,env.BACKUP_ENCRYPTION_PASSPHRASE).count,2);
  const manifestPath=path.join(folder,'manifest.json'),original=fs.readFileSync(manifestPath,'utf8'),manifest=JSON.parse(original);
  for(const change of [
   m=>m.objects[1].name=m.objects[0].name,
   m=>m.objects[1].file=m.objects[0].file,
   m=>m.objects[0].size=-1,
   m=>m.objects[0].sha256='x',
   m=>m.objects[0].file='../bad.edst.enc',
  ]){
   const m=JSON.parse(original);change(m);fs.writeFileSync(manifestPath,JSON.stringify(m));
   assert.throws(()=>verify(folder,env.BACKUP_ENCRYPTION_PASSPHRASE));
  }
  fs.writeFileSync(manifestPath,original);
  const file=path.join(folder,manifest.objects[1].file),bytes=fs.readFileSync(file);
  fs.writeFileSync(file,Buffer.concat([bytes.subarray(0,-1),Buffer.from([bytes.at(-1)^1])]));
  let uploads=0;
  await assert.rejects(restore(folder,{env,fetchImpl:async(url)=>{if(String(url).includes('/object/list/'))return {ok:true,json:async()=>[]};uploads++;return {ok:true}},logger:()=>{}}));
  assert.equal(uploads,0,'corrupted second object must not upload first object');
  fs.writeFileSync(file,bytes);
  const linked=path.join(folder,manifest.objects[1].file);
  fs.unlinkSync(linked);fs.symlinkSync(manifestPath,linked);
  assert.throws(()=>verify(folder,env.BACKUP_ENCRYPTION_PASSPHRASE),/File backup tidak valid/);
  console.log('PASS V81: strict manifest, duplicate detection, symlink defense, no partial restore on corruption');
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
