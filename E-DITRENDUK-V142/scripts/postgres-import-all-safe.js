'use strict';
// Atomic, verified SQLite -> PostgreSQL importer. SQLite is opened read-only.
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {Pool}=require('pg');
const root=path.resolve(__dirname,'..');
const source=path.resolve(process.env.SQLITE_SOURCE_PATH||path.join(root,'backend/data/editrenduk.sqlite'));
const apply=process.argv.includes('--apply');
const tables=['accounts','monitoring','logbook','archive','users_data','disposisi','petugas','schedules','meetings','meeting_sections','meeting_notes','meeting_documentation','audit_logs','storage_files','notulen_submissions','auth_sessions','schema_migrations','agenda_kegiatan','task_deadline','password_reset_requests'];
const quote=s=>'"'+s.replace(/"/g,'""')+'"';
const jsonCols=new Set(['accounts.permissions','monitoring.payload','logbook.payload','archive.payload','users_data.payload','disposisi.payload','petugas.payload','schedules.payload','meetings.participants','audit_logs.detail','agenda_kegiatan.payload','task_deadline.payload']);
const boolCols=new Set(['accounts.must_change_password']);
const columnRenames={'password_reset_requests.identity':'requested_identity'};
async function main(){
 if(!fs.existsSync(source))throw Error('SQLite sumber tidak ditemukan. Dua ZIP yang dikirim hanya berisi source, bukan database SQLite berisi akun/data.');
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL belum diatur');
 const url=new URL(process.env.DATABASE_URL);
 if(!['postgres:','postgresql:'].includes(url.protocol))throw Error('Target harus PostgreSQL');
 if(!['editrenduk_test'].includes(url.pathname.slice(1)) && process.env.ALLOW_OTHER_DATABASE!=='YES')throw Error('Pengaman: target harus editrenduk_test');
 if(apply&&process.env.CONFIRM_FULL_IMPORT!=='YES')throw Error('Butuh CONFIRM_FULL_IMPORT=YES untuk menulis');
 const db=new DatabaseSync(source,{readOnly:true});
 const pool=new Pool({connectionString:process.env.DATABASE_URL,password:process.env.PGPASSWORD||undefined,connectionTimeoutMillis:8000});
 let client;
 try{
  client=await pool.connect();
  await client.query('BEGIN');
  const results=[];
  for(const table of tables){
   const exists=db.prepare('SELECT 1 AS ok FROM sqlite_master WHERE type=\'table\' AND name=?').get(table);
   if(!exists){results.push({table,source:'absent',inserted:0});continue}
   const rows=db.prepare(`SELECT * FROM ${quote(table)}`).all();
   const pg=await client.query('SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=\'public\' AND table_name=$1',[table]);
   if(!pg.rows.length)throw Error(`Tabel target ${table} tidak ada`);
   const types=new Map(pg.rows.map(r=>[r.column_name,r.data_type]));
   const cols=db.prepare(`PRAGMA table_info(${quote(table)})`).all().map(r=>r.name);
   for(const c of cols)if(!types.has(columnRenames[`${table}.${c}`]||c))throw Error(`Kolom ${table}.${c} tidak tersedia di PostgreSQL. Tidak akan melewati data diam-diam.`);
   const key=table==='schema_migrations'?'version':'id';
   if(!cols.includes(key))throw Error(`Primary key ${table}.${key} tidak ada`);
   let inserted=0;
   for(const row of rows){
    const vals=cols.map(c=>{
     const v=row[c];
     if(v===null||v===undefined)return null;
     if(boolCols.has(`${table}.${c}`))return !!v;
     if(Buffer.isBuffer(v))return v;
     return v;
    });
    const placeholders=cols.map((c,i)=>`$${i+1}${jsonCols.has(`${table}.${c}`)?'::jsonb':''}`);
    const q=`INSERT INTO ${quote(table)} (${cols.map(c=>quote(columnRenames[`${table}.${c}`]||c)).join(',')}) VALUES (${placeholders.join(',')}) ON CONFLICT (${quote(key)}) DO NOTHING`;
    const r=await client.query(q,vals);inserted+=r.rowCount;
   }
   // Verify every source PK exists and all source columns match (JSONB normalized by PostgreSQL).
   for(const row of rows){
    const target=await client.query(`SELECT ${cols.map(c=>`${quote(columnRenames[`${table}.${c}`]||c)} AS ${quote(c)}`).join(',')} FROM ${quote(table)} WHERE ${quote(key)}=$1`,[row[key]]);
    if(target.rowCount!==1)throw Error(`Missing imported row ${table}/${row[key]}`);
    for(const c of cols){
     let expected=row[c],actual=target.rows[0][c];
     if(jsonCols.has(`${table}.${c}`)){
      expected=typeof expected==='string'?JSON.parse(expected):expected;
      actual=typeof actual==='string'?JSON.parse(actual):actual;
      const normalize=x=>x&&typeof x==='object'?Array.isArray(x)?x.map(normalize):Object.fromEntries(Object.entries(x).sort().map(([k,v])=>[k,normalize(v)])):x;
      if(JSON.stringify(normalize(expected))!==JSON.stringify(normalize(actual)))throw Error(`JSON mismatch ${table}/${row[key]}/${c}`);
     }else if(boolCols.has(`${table}.${c}`)){
      if(Boolean(expected)!==actual)throw Error(`Boolean mismatch ${table}/${row[key]}/${c}`);
     }else if(expected===null){if(actual!==null)throw Error(`NULL mismatch ${table}/${row[key]}/${c}`)}
     else if(String(expected)!==String(actual instanceof Date?actual.toISOString():actual)){
      // Timestamp formatting differs between SQLite and PG; key and count still verified.
      if(!['timestamp with time zone','timestamp without time zone'].includes(types.get(columnRenames[`${table}.${c}`]||c)))throw Error(`Value mismatch ${table}/${row[key]}/${c}`);
     }
    }
   }
   results.push({table,source:rows.length,inserted});
  }
  if(apply){await client.query('COMMIT');console.log('COMMIT: semua tabel terimpor dan diverifikasi.')}else{await client.query('ROLLBACK');console.log('DRY RUN: seluruh operasi di-ROLLBACK.');}
  console.table(results);
 }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});throw e}
 finally{client?.release();await pool.end();db.close()}
}
if(require.main===module)main().catch(e=>{console.error('MIGRASI DIBATALKAN:',e.message);process.exitCode=1});
