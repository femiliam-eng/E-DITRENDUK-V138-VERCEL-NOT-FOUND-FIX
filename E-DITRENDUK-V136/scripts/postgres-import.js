'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process'),{DatabaseSync}=require('node:sqlite');
const ROOT=path.resolve(__dirname,'..'),url=process.env.DATABASE_URL;if(!url){console.error('DATABASE_URL belum diatur.');process.exit(1)}
const dbPath=path.join(ROOT,'backend','data','editrenduk.sqlite');if(!fs.existsSync(dbPath)){console.error('SQLite sumber tidak ditemukan.');process.exit(1)}
const db=new DatabaseSync(dbPath,{readOnly:true});
const tables=['accounts','monitoring','logbook','archive','users_data','disposisi','petugas','schedules','meetings','meeting_sections','meeting_notes','meeting_documentation','audit_logs','storage_files','notulen_submissions','auth_sessions','schema_migrations'];
const jsonCols=new Set(['accounts.permissions','monitoring.payload','logbook.payload','archive.payload','users_data.payload','disposisi.payload','petugas.payload','schedules.payload','meetings.participants','audit_logs.detail']);
const boolCols=new Set(['accounts.must_change_password']);
const lit=(v,key)=>{if(v===null||v===undefined)return'NULL';if(boolCols.has(key))return Number(v)?'TRUE':'FALSE';const q=String(v).replace(/'/g,"''");return `'${q}'${jsonCols.has(key)?'::jsonb':''}`};
let sql='BEGIN;\n';const counts={};for(const table of tables){let rows=[];try{rows=db.prepare(`SELECT * FROM ${table}`).all()}catch{continue}counts[table]=rows.length;for(const row of rows){const cols=Object.keys(row);sql+=`INSERT INTO ${table} (${cols.map(c=>'"'+c+'"').join(',')}) VALUES (${cols.map(c=>lit(row[c],`${table}.${c}`)).join(',')}) ON CONFLICT DO NOTHING;\n`}}sql+='COMMIT;\n';db.close();
const tmp=path.join(os.tmpdir(),`editrenduk-pg-import-${process.pid}.sql`);fs.writeFileSync(tmp,sql,{mode:0o600});const r=spawnSync('psql',[url,'-v','ON_ERROR_STOP=1','-f',tmp],{stdio:'inherit'});try{fs.unlinkSync(tmp)}catch{}if(r.error?.code==='ENOENT'){console.error('psql tidak ditemukan. Install PostgreSQL client terlebih dahulu.');process.exit(1)}if(r.status!==0)process.exit(r.status||1);console.log('Import SQLite -> PostgreSQL selesai.');console.table(counts);
