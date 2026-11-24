'use strict';
// Authenticated decrypt to pg_restore --list; no restore and no plaintext temp files.
const {createDecipheriv,scryptSync}=require('node:crypto');
const {createReadStream,statSync,openSync,readSync,closeSync}=require('node:fs');
const {spawn}=require('node:child_process');
const {pipeline}=require('node:stream/promises');
const {MAGIC}=require('./pg-backup-secure');
async function inspect(file,{passphrase=process.env.BACKUP_ENCRYPTION_PASSPHRASE,spawnImpl=spawn}={}){
 if(!file)throw Error('Berikan lokasi file .pgbak.enc');
 if(!passphrase||Buffer.byteLength(passphrase)<24)throw Error('Passphrase backup wajib');
 const size=statSync(file).size,headerLength=MAGIC.length+16+12;
 if(size<headerLength+16)throw Error('File backup terlalu kecil');
 const fd=openSync(file,'r'),header=Buffer.alloc(headerLength),tag=Buffer.alloc(16);
 try{readSync(fd,header,0,header.length,0);readSync(fd,tag,0,16,size-16)}finally{closeSync(fd)}
 if(!header.subarray(0,MAGIC.length).equals(MAGIC))throw Error('Format backup tidak dikenal');
 const salt=header.subarray(MAGIC.length,MAGIC.length+16),iv=header.subarray(MAGIC.length+16);
 const key=scryptSync(passphrase,salt,32,{maxmem:64*1024*1024});
 const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAuthTag(tag);
 const proc=spawnImpl('pg_restore',['--list'],{stdio:['pipe','pipe','pipe']});
 let listing='',err='';
 proc.stdout.on('data',b=>{listing+=b.toString().slice(0,10000)});
 proc.stderr.on('data',b=>{err+=b.toString().slice(0,1000)});
 const reader=createReadStream(file,{start:headerLength,end:size-17});
 try{
  await Promise.all([
   pipeline(reader,decipher,proc.stdin),
   new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('close',code=>code===0?resolve():reject(Error('pg_restore gagal membaca arsip (exit '+code+')')))}),
  ]);
  console.log('PASS: backup terautentikasi dan format pg_dump valid.');
  console.log('Objek database dalam arsip:',listing.split('\n').filter(x=>x&&!x.startsWith(';')).length);
 }catch(e){proc.kill();throw e}
 finally{key.fill(0)}
}
if(require.main===module)inspect(process.argv[2]).catch(e=>{console.error('GAGAL VERIFIKASI:',e.message);process.exitCode=1});
module.exports={inspect};
