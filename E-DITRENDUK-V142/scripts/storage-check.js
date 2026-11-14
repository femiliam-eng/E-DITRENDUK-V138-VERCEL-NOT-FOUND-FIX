'use strict';
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..'), uploadDir=path.join(root,'uploads','notulen'), dbPath=path.join(root,'backend','data','editrenduk.sqlite');
if(!fs.existsSync(dbPath)) throw new Error('Database belum ada.');
const db=new DatabaseSync(dbPath); const docs=db.prepare('SELECT id,meeting_id,file_name,data_url FROM meeting_documentation').all();
let missing=0, registered=0;
for(const d of docs){
 if(!String(d.data_url||'').startsWith('/uploads/notulen/')) continue;
 const full=path.join(root,d.data_url.replace(/^\//,'')); if(!fs.existsSync(full)){console.log(`MISSING ${d.data_url}`);missing++;continue;}
 const st=fs.statSync(full), ext=path.extname(full).toLowerCase(), mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}[ext]||'application/octet-stream';
 db.prepare(`INSERT OR IGNORE INTO storage_files(id,resource,resource_id,file_name,stored_path,mime_type,size_bytes) VALUES(?,?,?,?,?,?,?)`).run(`file_${d.id}`,'notulen',d.meeting_id,d.file_name||path.basename(full),d.data_url,mime,st.size); registered++;
}
const physical=fs.existsSync(uploadDir)?fs.readdirSync(uploadDir).filter(x=>x!=='.gitkeep'):[];
const known=new Set(db.prepare('SELECT stored_path FROM storage_files').all().map(x=>path.basename(x.stored_path)));
const orphan=physical.filter(x=>!known.has(x));
console.log(`Dokumentasi DB: ${docs.length} | file terdaftar/dicek: ${registered} | hilang: ${missing} | orphan: ${orphan.length}`);
if(orphan.length) console.log('Orphan:',orphan.join(', '));
db.close(); if(missing) process.exitCode=2;
