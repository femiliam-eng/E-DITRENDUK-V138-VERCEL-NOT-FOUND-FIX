'use strict';
// Controlled restore into an explicitly named staging bucket. Never overwrites objects.
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {verify,readManifest}=require('./supabase-backup-verify');
const {decrypt,listObjects}=require('./supabase-storage-backup');
const {createSupabaseStorage}=require('../backend/supabase-storage');
const BUCKET=/^[a-z0-9][a-z0-9_-]{1,62}$/i;
function plan(folder,{env=process.env}={}){
 const passphrase=env.BACKUP_ENCRYPTION_PASSPHRASE;
 const checked=verify(folder,passphrase);
 const {manifest}=readManifest(folder);
 const target=env.RESTORE_TARGET_BUCKET||'';
 if(!BUCKET.test(target)||target===checked.bucket)throw Error('RESTORE_TARGET_BUCKET harus bucket uji berbeda dari sumber');
 if(!/(-staging|-test|-sandbox)$/i.test(target))throw Error('Nama bucket tujuan harus berakhiran -staging, -test atau -sandbox');
 if(!manifest.objects.length)throw Error('Backup kosong, tidak ada objek dipulihkan');
 return {folder:path.resolve(folder),source:checked.bucket,target,objects:manifest.objects,passphrase};
}
async function restore(folder,{env=process.env,fetchImpl=fetch,logger=console.log}={}){
 const p=plan(folder,{env});
 if(env.RESTORE_CONFIRM!=='RESTORE_TO_'+p.target){
  logger('DRY RUN: '+p.objects.length+' dokumen, sumber '+p.source+', tujuan '+p.target);
  logger('Untuk menjalankan, set RESTORE_CONFIRM=RESTORE_TO_'+p.target);
  return {dryRun:true,count:p.objects.length,target:p.target};
 }
 if(env.NODE_ENV==='production')throw Error('Restore dilarang pada NODE_ENV=production');
 const existing=await listObjects({url:env.SUPABASE_URL,key:env.SUPABASE_SERVICE_ROLE_KEY,bucket:p.target,fetchImpl});
 const collisions=p.objects.filter(o=>existing.includes(o.name));
 if(collisions.length)throw Error('Restore dibatalkan: '+collisions.length+' file sudah ada di bucket staging.');
 const storage=createSupabaseStorage({url:env.SUPABASE_URL,key:env.SUPABASE_SERVICE_ROLE_KEY,bucket:p.target,fetchImpl});
 // Preflight all objects before first write, preventing partial uploads from a corrupt archive.
 const prepared=p.objects.map(o=>{
  const bytes=decrypt(fs.readFileSync(path.join(p.folder,o.file)),p.passphrase);
  if(bytes.length!==o.size||createHash('sha256').update(bytes).digest('hex')!==o.sha256)throw Error('Checksum tidak cocok');
  return {o,bytes};
 });
 let done=0;
 for(const {o,bytes} of prepared){
  const mime=o.name.endsWith('.pdf')?'application/pdf':o.name.endsWith('.docx')?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'application/msword';
  await storage.put(o.name,bytes,mime); // x-upsert=false: existing object triggers error.
  done++;
 }
 logger('RESTORE TEST: '+done+' dokumen di bucket '+p.target);
 return {dryRun:false,count:done,target:p.target};
}
if(require.main===module)restore(process.argv[2]).catch(e=>{console.error('RESTORE GAGAL:',e.message);process.exitCode=1});
module.exports={plan,restore};
