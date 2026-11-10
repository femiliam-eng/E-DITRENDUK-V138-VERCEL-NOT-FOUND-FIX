'use strict';
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..'), dbPath=path.join(root,'backend','data','editrenduk.sqlite');
if(!fs.existsSync(dbPath)) throw new Error('Database SQLite belum ada. Jalankan aplikasi/migrate terlebih dahulu.');
const db=new DatabaseSync(dbPath,{readOnly:true});
const out=path.join(root,'postgres-export',new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(out,{recursive:true});
const tables=['accounts','monitoring','logbook','archive','users_data','disposisi','petugas','schedules','meetings','meeting_sections','meeting_notes','meeting_documentation','audit_logs','storage_files','auth_sessions','schema_migrations'];
const counts={};
for(const table of tables){
 let rows=[]; try{rows=db.prepare(`SELECT * FROM ${table}`).all();}catch{continue;}
 counts[table]=rows.length;
 fs.writeFileSync(path.join(out,`${table}.json`),JSON.stringify(rows,null,2));
}
fs.copyFileSync(path.join(root,'postgres','schema.sql'),path.join(out,'schema.sql'));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),source:'SQLite',target:'PostgreSQL',counts,note:'Password hash tetap hash; jangan ekspor file ini ke repositori publik.'},null,2));
db.close(); console.log(`Paket migrasi PostgreSQL dibuat: ${out}`); console.table(counts);
