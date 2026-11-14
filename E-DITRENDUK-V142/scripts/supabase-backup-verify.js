'use strict';
// Strict offline validation; never writes decrypted files to disk.
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {decrypt}=require('./supabase-storage-backup');
const NAME=/^[a-z0-9_-]{1,100}\.(pdf|docx|doc)$/i;
const FILE=/^[0-9]{6}\.edst\.enc$/;
const BUCKET=/^[a-z0-9][a-z0-9_-]{1,62}$/i;
const MAX_OBJECT=6*1024*1024;
function readManifest(dir){
 if(!dir)throw Error('Folder backup wajib');
 const folder=path.resolve(dir);
 if(fs.lstatSync(folder).isSymbolicLink()||!fs.statSync(folder).isDirectory())throw Error('Folder backup tidak valid');
 const manifestPath=path.join(folder,'manifest.json');
 if(fs.lstatSync(manifestPath).isSymbolicLink()||fs.statSync(manifestPath).size>4*1024*1024)throw Error('Manifest tidak valid');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 if(manifest.format!=='editrenduk-supabase-backup-v1'||!BUCKET.test(manifest.bucket)||!Array.isArray(manifest.objects)||manifest.objects.length>100000)throw Error('Manifest tidak dikenal');
 const seenFiles=new Set(),seenNames=new Set();
 for(const o of manifest.objects){
  if(!o||!NAME.test(o.name)||!FILE.test(o.file)||seenFiles.has(o.file)||seenNames.has(o.name)||!Number.isSafeInteger(o.size)||o.size<1||o.size>MAX_OBJECT||!/^[a-f0-9]{64}$/.test(o.sha256))throw Error('Manifest tidak valid');
  seenFiles.add(o.file);seenNames.add(o.name);
  const p=path.join(folder,o.file),st=fs.lstatSync(p);
  if(!st.isFile()||st.isSymbolicLink()||st.size<49||st.size>MAX_OBJECT+49)throw Error('File backup tidak valid: '+o.file);
 }
 return {folder,manifest};
}
function verify(dir,passphrase=process.env.BACKUP_ENCRYPTION_PASSPHRASE){
 if(!passphrase||Buffer.byteLength(passphrase)<24)throw Error('Passphrase backup minimal 24 karakter wajib');
 const {folder,manifest}=readManifest(dir);
 for(const o of manifest.objects){
  const data=decrypt(fs.readFileSync(path.join(folder,o.file)),passphrase);
  if(data.length!==o.size||createHash('sha256').update(data).digest('hex')!==o.sha256)throw Error('Checksum tidak cocok: '+o.file);
 }
 return {count:manifest.objects.length,bucket:manifest.bucket};
}
if(require.main===module){try{const r=verify(process.argv[2]);console.log('PASS: '+r.count+' objek valid dari bucket '+r.bucket)}catch(e){console.error('FAIL:',e.message);process.exitCode=1}}
module.exports={verify,readManifest};
