 'use strict';
// Read-only, exact logical payload parity across SQLite and PostgreSQL.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const {DatabaseSync}=require('node:sqlite');
const TABLES=['monitoring','logbook','archive','users_data','disposisi','petugas','schedules'];
function canonical(value){
 if(Array.isArray(value)) return value.map(canonical);
 if(value && typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
 return value;
}
function digest(value){return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
function compare(local,remote){
 const a=new Map(local.map(r=>[String(r.id),digest(typeof r.payload==='string'?JSON.parse(r.payload):r.payload)]));
 const b=new Map(remote.map(r=>[String(r.id),digest(typeof r.payload==='string'?JSON.parse(r.payload):r.payload)]));
 const ids=new Set([...a.keys(),...b.keys()]);
 return [...ids].filter(id=>a.get(id)!==b.get(id)).sort();
}
if(process.argv.includes('--self-test')){
 const ok=compare([{id:'a',payload:'{"z":1,"a":{"x":2}}'}],[{id:'a',payload:{a:{x:2},z:1}}]);
 const bad=compare([{id:'a',payload:'{"x":1}'}],[{id:'a',payload:{x:2}}]);
 if(ok.length||bad.join()!=='a')throw Error('Self-test perbandingan payload gagal');
 console.log('PostgreSQL data parity self-test: LULUS (canonical JSON dan deteksi perubahan).');process.exit(0);
}
const url=process.env.DATABASE_URL;
if(!url){console.error('DATABASE_URL wajib diatur.');process.exit(2)}
const file=path.resolve(__dirname,'../backend/data/editrenduk.sqlite');
if(!fs.existsSync(file)){console.error('SQLite sumber tidak ditemukan.');process.exit(2)}
const db=new DatabaseSync(file,{readOnly:true});let failed=false;
try{
 for(const table of TABLES){
  const local=db.prepare(`SELECT id,payload FROM "${table}" ORDER BY id`).all();
  const sql=`SELECT json_build_object('id',id,'payload',payload)::text FROM "${table}" ORDER BY id`;
  const result=spawnSync('psql',[url,'-X','-A','-t','-v','ON_ERROR_STOP=1','-c',sql],{encoding:'utf8',timeout:30000,env:{...process.env,PGCONNECT_TIMEOUT:'8'},maxBuffer:64*1024*1024});
  if(result.error||result.status!==0){console.error(`${table}: koneksi/query gagal: ${result.error?.message||result.stderr?.trim()}`);failed=true;break}
  let remote;try{remote=result.stdout.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line))}catch(e){console.error(`${table}: output PostgreSQL tidak valid: ${e.message}`);failed=true;break}
  const differences=compare(local,remote);
  console.log(`${differences.length?'BEDA':'OK'} ${table}: SQLite=${local.length}, PostgreSQL=${remote.length}, mismatch=${differences.length}${differences.length?', contoh ID='+differences.slice(0,5).join(','):''}`);
  if(differences.length)failed=true;
 }
}finally{db.close()}
if(failed){console.error('Data parity GAGAL. Jangan cutover.');process.exit(1)}
console.log('Data parity 7 tabel payload LULUS. Belum membuktikan parity endpoint atau PostgreSQL runtime.');
