'use strict';
// Encrypted PostgreSQL backup; never writes a plaintext dump to disk.
const {spawn}=require('node:child_process');
const {createCipheriv,randomBytes,scryptSync,createHash}=require('node:crypto');
const {createWriteStream,mkdirSync,chmodSync,unlinkSync,renameSync}=require('node:fs');
const {pipeline}=require('node:stream/promises');
const path=require('node:path');
const MAGIC=Buffer.from('EDITRENDUK-PGBK1\n');
function validateEnv(env){
 if(!/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL||''))throw Error('DATABASE_URL PostgreSQL wajib');
 if(!env.BACKUP_ENCRYPTION_PASSPHRASE||Buffer.byteLength(env.BACKUP_ENCRYPTION_PASSPHRASE)<24)throw Error('BACKUP_ENCRYPTION_PASSPHRASE minimal 24 karakter');
 const target=path.resolve(env.BACKUP_OUTPUT_DIR||'');
 if(!env.BACKUP_OUTPUT_DIR||target===path.resolve(__dirname,'..')||target.startsWith(path.resolve(__dirname,'..')+path.sep))throw Error('BACKUP_OUTPUT_DIR harus folder di luar source aplikasi');
 return target;
}
async function backup({env=process.env,spawnImpl=spawn,log=console.log}={}){
 const dir=validateEnv(env);mkdirSync(dir,{recursive:true,mode:0o700});
 const salt=randomBytes(16),iv=randomBytes(12),key=scryptSync(env.BACKUP_ENCRYPTION_PASSPHRASE,salt,32,{maxmem:64*1024*1024});
 const filename='editrenduk-'+new Date().toISOString().replace(/[:.]/g,'-')+'.pgbak.enc';
 const dest=path.join(dir,filename),partial=dest+'.partial';
 const output=createWriteStream(partial,{flags:'wx',mode:0o600});
 const cipher=createCipheriv('aes-256-gcm',key,iv);
 output.write(Buffer.concat([MAGIC,salt,iv]));
 const args=['--format=custom','--no-owner','--no-acl'];
 const child=spawnImpl('pg_dump',args,{env:{...env,PGDATABASE:env.DATABASE_URL,PGPASSWORD:env.PGPASSWORD},stdio:['ignore','pipe','pipe']});
 let errorText='';
 child.stderr.on('data',b=>{errorText+=b.toString().slice(0,300)});
 try{
  await Promise.all([
   pipeline(child.stdout,cipher,output,{end:false}),
   new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error('pg_dump gagal (exit '+code+'). Periksa koneksi dan kredensial.')))}),
  ]);
  const tag=cipher.getAuthTag();
  await new Promise((resolve,reject)=>output.end(tag,err=>err?reject(err):resolve()));
  renameSync(partial,dest);chmodSync(dest,0o600);
  log('Backup PostgreSQL terenkripsi dibuat: '+dest);
  log('Simpan passphrase terpisah. Uji pemulihan di database pengujian.');
  return dest;
 }catch(e){child.kill();output.destroy();try{unlinkSync(partial)}catch{}throw e}
 finally{key.fill(0)}
}
if(require.main===module)backup().catch(e=>{console.error('GAGAL BACKUP:',e.message);process.exitCode=1});
module.exports={backup,validateEnv,MAGIC};
