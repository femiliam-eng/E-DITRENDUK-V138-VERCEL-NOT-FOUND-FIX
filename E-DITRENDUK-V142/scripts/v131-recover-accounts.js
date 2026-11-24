#!/usr/bin/env node
'use strict';
// Safe guided local recovery: never auto-selects a source or imports without explicit confirmation.
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {importAuth}=require('./postgres-auth-import');
const {verify}=require('./postgres-auth-parity');
function inspect(file){
 let db;
 try{
  if(!fs.statSync(file).isFile())return null;
  db=new DatabaseSync(file,{readOnly:true});
  const names=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name));
  if(!names.has('accounts'))return null;
  const n=db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n;
  return {path:file,accounts:n};
 }catch{return null}finally{try{db?.close()}catch{}}
}
function scan(root,maxDepth=6,limit=7000){
 const found=[],pending=[{dir:root,depth:0}];let seen=0;
 while(pending.length&&seen<limit){
  const {dir,depth}=pending.pop();let entries=[];
  try{entries=fs.readdirSync(dir,{withFileTypes:true})}catch{continue}
  for(const entry of entries){
   if(++seen>limit)break;
   if(entry.isSymbolicLink())continue;
   const full=path.join(dir,entry.name);
   if(entry.isDirectory()&&depth<maxDepth){
    if(!['node_modules','.git','AppData','backups'].includes(entry.name))pending.push({dir:full,depth:depth+1});
   }else if(entry.isFile()&&/\.(sqlite3?|db)$/i.test(entry.name)){
    const item=inspect(full);if(item)found.push(item);
   }
  }
 }
 return found.sort((a,b)=>b.accounts-a.accounts);
}
function args(argv){
 const sourceArg=argv.find(x=>x.startsWith('--source='));
 return {source:sourceArg?sourceArg.slice('--source='.length):null,apply:argv.includes('--apply')};
}
async function run(argv=process.argv.slice(2),env=process.env){
 const {source,apply}=args(argv);
 if(!source){
  const home=env.USERPROFILE||env.HOME;
  if(!home)throw Error('Direktori pengguna tidak diketahui, gunakan --source=PATH');
  const root=path.join(home,'Downloads');
  const matches=scan(root);
  console.log('Database SQLite lama dengan tabel accounts (tanpa menampilkan isi akun):');
  if(matches.length)for(const item of matches)console.log(`- ${item.path} | ${item.accounts} akun`);
  else console.log('Tidak ditemukan di Downloads. Gunakan --source=PATH untuk lokasi lain.');
  console.log('Pilih database lama dengan akun yang kamu gunakan. Tidak ada data yang diubah.');
  return {found:matches.length};
 }
 const resolved=path.resolve(source),meta=inspect(resolved);
 if(!meta)throw Error('File bukan SQLite akun E-DITRENDUK atau tidak bisa dibaca.');
 if(meta.accounts===0)throw Error('Database SQLite sumber tidak memiliki akun. Pilih file lama lainnya.');
 if(!env.DATABASE_URL)throw Error('DATABASE_URL PostgreSQL wajib tersedia di terminal ini.');
 if(apply&&env.CONFIRM_AUTH_IMPORT!=='YES')throw Error('Impor dibatalkan: set CONFIRM_AUTH_IMPORT=YES setelah backup dan dry-run.');
 const db=new DatabaseSync(resolved,{readOnly:true});
 const {Pool}=require('pg');const pool=new Pool({connectionString:env.DATABASE_URL,connectionTimeoutMillis:8000});
 try{
  await importAuth({db,pool,apply});
  if(apply){
   const result=await verify({db,pool});
   console.log(`VERIFIKASI AKUN: ${result.ok?'LULUS':'GAGAL'} (sumber ${result.localAccounts}, PostgreSQL ${result.pgAccounts}; tidak menampilkan password).`);
   if(!result.ok)process.exitCode=2;
  }
 }finally{db.close();await pool.end()}
}
if(require.main===module)run().catch(e=>{console.error('PEMULIHAN BELUM BERHASIL:',e.message);process.exitCode=1});
module.exports={inspect,scan,args,run};
