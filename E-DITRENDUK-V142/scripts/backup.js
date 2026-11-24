'use strict';
// npm run backup -> database konsisten + uploads + manifest dalam satu folder backup.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..'), source=path.join(root,'backend','data','editrenduk.sqlite');
const uploads=path.join(root,'uploads','notulen'), backupRoot=path.join(root,'backups');
if(!fs.existsSync(source)){console.error('Database belum dibuat. Jalankan npm start terlebih dahulu.');process.exit(1);}
fs.mkdirSync(backupRoot,{recursive:true});
const stamp=new Date().toISOString().replace(/[:.]/g,'-'), dir=path.join(backupRoot,`backup-${stamp}`);
fs.mkdirSync(dir,{recursive:true});
const dbTarget=path.join(dir,'editrenduk.sqlite');
const db=new DatabaseSync(source,{readOnly:true});
try{
 db.prepare('VACUUM main INTO ?').run(dbTarget);
 const check=new DatabaseSync(dbTarget,{readOnly:true});
 try{if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Backup gagal uji integritas');}
 finally{check.close();}
 if(fs.existsSync(uploads))fs.cpSync(uploads,path.join(dir,'uploads','notulen'),{recursive:true});
 const files=[];
 function inventory(folder){
  if(!fs.existsSync(folder))return;
  for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
   const full=path.join(folder,entry.name);
   if(entry.isDirectory())inventory(full);
   else if(entry.isFile()){
    const relative=path.relative(dir,full).split(path.sep).join('/');
    const sha256=crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
    files.push({path:relative,size:fs.statSync(full).size,sha256});
   }
  }
 }
 inventory(dir);
 const manifest={app:'E-DITRENDUK',format_version:2,created_at:new Date().toISOString(),database:'editrenduk.sqlite',uploads:'uploads/notulen',node:process.version,files};
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log(`Backup lengkap berhasil: ${dir}`);
}catch(e){fs.rmSync(dir,{recursive:true,force:true});console.error(e.message);process.exitCode=1}
finally{db.close()}
