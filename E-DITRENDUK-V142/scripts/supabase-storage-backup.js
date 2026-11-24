'use strict';
// Private Supabase Storage backup: each object encrypted independently, manifest contains no tokens.
const fs=require('node:fs');
const path=require('node:path');
const {randomBytes,scryptSync,createCipheriv,createHash}=require('node:crypto');
const {createSupabaseStorage}=require('../backend/supabase-storage');
function config(env=process.env){
 const {SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key,SUPABASE_STORAGE_BUCKET:bucket='notulen-private',BACKUP_ENCRYPTION_PASSPHRASE:passphrase,BACKUP_OUTPUT_DIR:dir}=env;
 if(!url||!key||!passphrase||Buffer.byteLength(passphrase)<24||!dir)throw Error('Supabase credentials, BACKUP_OUTPUT_DIR dan passphrase >=24 karakter wajib');
 const root=path.resolve(__dirname,'..'),target=path.resolve(dir);
 if(target===root||target.startsWith(root+path.sep))throw Error('Backup harus di luar folder aplikasi');
 return {url,key,bucket,passphrase,target};
}
async function listObjects({url,key,bucket,fetchImpl=fetch,limit=100}){
 const endpoint=new URL('/storage/v1/object/list/'+encodeURIComponent(bucket),url);
 const names=new Set();
 for(let offset=0;offset<100000;offset+=limit){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),20000);
  let res;
  try{
   res=await fetchImpl(endpoint,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({prefix:'',limit,offset,sortBy:{column:'name',order:'asc'}}),signal:ctrl.signal,redirect:'error'});
  }finally{clearTimeout(timer)}
  if(!res.ok)throw Error('Supabase listing gagal HTTP '+res.status);
  const items=await res.json();
  if(!Array.isArray(items)||items.length>limit)throw Error('Respons listing tidak valid');
  for(const item of items){
   if(!item||typeof item.name!=='string'||!(/^[a-z0-9_-]{1,100}\.(pdf|docx|doc)$/i.test(item.name)))throw Error('Nama file di bucket tidak didukung: periksa struktur folder');
   if(names.has(item.name))throw Error('Listing duplikat, backup dibatalkan');
   names.add(item.name);
  }
  if(items.length<limit)return [...names];
 }
 throw Error('Jumlah objek melewati batas pengamanan');
}
function encrypt(bytes,passphrase){
 const salt=randomBytes(16),iv=randomBytes(12),key=scryptSync(passphrase,salt,32,{maxmem:64*1024*1024});
 try{
  const cipher=createCipheriv('aes-256-gcm',key,iv),body=Buffer.concat([cipher.update(bytes),cipher.final()]);
  return Buffer.concat([Buffer.from('EDST1'),salt,iv,cipher.getAuthTag(),body]);
 }finally{key.fill(0)}
}
function decrypt(bytes,passphrase){
 if(!Buffer.isBuffer(bytes)||bytes.length<49||bytes.subarray(0,5).toString()!=='EDST1')throw Error('Format backup dokumen tidak valid');
 const key=scryptSync(passphrase,bytes.subarray(5,21),32,{maxmem:64*1024*1024});
 try{
  const decipher=require('node:crypto').createDecipheriv('aes-256-gcm',key,bytes.subarray(21,33));
  decipher.setAuthTag(bytes.subarray(33,49));
  return Buffer.concat([decipher.update(bytes.subarray(49)),decipher.final()]);
 }finally{key.fill(0)}
}
async function backup({env=process.env,fetchImpl=fetch}={}){
 const cfg=config(env);
 const names=await listObjects({...cfg,fetchImpl});
 const storage=createSupabaseStorage({...cfg,fetchImpl});
 fs.mkdirSync(cfg.target,{recursive:true,mode:0o700});
 const run=path.join(cfg.target,'supabase-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(4).toString('hex'));
 fs.mkdirSync(run,{mode:0o700});
 const manifest={format:'editrenduk-supabase-backup-v1',bucket:cfg.bucket,createdAt:new Date().toISOString(),objects:[]};
 try{
  for(const [i,name] of names.entries()){
   const data=await storage.get(name),encrypted=encrypt(data,cfg.passphrase);
   const file=String(i+1).padStart(6,'0')+'.edst.enc';
   fs.writeFileSync(path.join(run,file),encrypted,{flag:'wx',mode:0o600});
   manifest.objects.push({name,file,size:data.length,sha256:createHash('sha256').update(data).digest('hex')});
  }
  fs.writeFileSync(path.join(run,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});
  console.log('PASS: '+names.length+' dokumen terenkripsi. Folder: '+run);
  console.log('Manifest berisi nama dan hash dokumen; simpan folder backup secara privat.');
  return run;
 }catch(e){
  fs.rmSync(run,{recursive:true,force:true});
  throw e;
 }
}
if(require.main===module)backup().catch(e=>{console.error('BACKUP GAGAL:',e.message);process.exitCode=1});
module.exports={config,listObjects,encrypt,decrypt,backup};
