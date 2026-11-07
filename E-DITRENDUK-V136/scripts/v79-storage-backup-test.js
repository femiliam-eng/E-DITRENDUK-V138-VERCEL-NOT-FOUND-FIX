'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {config,listObjects,encrypt,decrypt,backup}=require('./supabase-storage-backup');
const {verify}=require('./supabase-backup-verify');
const passphrase='very-long-private-backup-passphrase-123';
const base={SUPABASE_URL:'https://test.supabase.co/',SUPABASE_SERVICE_ROLE_KEY:'test-only',SUPABASE_STORAGE_BUCKET:'notulen-private',BACKUP_ENCRYPTION_PASSPHRASE:passphrase};
(async()=>{
 const bytes=Buffer.from('private document fixture');
 const encrypted=encrypt(bytes,passphrase);
 assert.deepEqual(decrypt(encrypted,passphrase),bytes);
 assert.throws(()=>decrypt(encrypted,'incorrect-long-passphrase-123456'),/auth|authenticate/i);
 const tampered=Buffer.from(encrypted);tampered[tampered.length-1]^=1;
 assert.throws(()=>decrypt(tampered,passphrase),/auth|authenticate/i);
 assert.throws(()=>config({...base,BACKUP_OUTPUT_DIR:path.resolve(__dirname,'..','data')}),/di luar/);
 const calls=[];
 const fetchImpl=async(url,options)=>{
  const u=new URL(url);calls.push(u.pathname);
  if(u.pathname.includes('/object/list/'))return {ok:true,json:async()=>[{name:'notulen1.pdf'}]};
  if(u.pathname.endsWith('/notulen1.pdf'))return {ok:true,arrayBuffer:async()=>bytes};
  throw Error('unexpected route '+u.pathname);
 };
 const names=await listObjects({...config({...base,BACKUP_OUTPUT_DIR:'/tmp/test'}),fetchImpl});
 assert.deepEqual(names,['notulen1.pdf']);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'editrenduk-v79-'));
 try{
  const run=await backup({env:{...base,BACKUP_OUTPUT_DIR:dir},fetchImpl});
  assert.deepEqual(verify(run,passphrase),{count:1,bucket:'notulen-private'});
  assert.equal(fs.readdirSync(run).length,2);
  const file=fs.readdirSync(run).find(f=>f.endsWith('.enc'));
  assert.equal(fs.readFileSync(path.join(run,file)).includes(bytes),false);
  const changed=fs.readFileSync(path.join(run,file));changed[changed.length-1]^=1;fs.writeFileSync(path.join(run,file),changed);
  assert.throws(()=>verify(run,passphrase),/auth|authenticate/i);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
 assert(calls.length>=3);
 console.log('PASS V79: Supabase Storage list, encrypted backup, tamper detection, manifest integrity');
})().catch(e=>{console.error(e);process.exitCode=1});
