'use strict';
// V68: default dry-run. Never prints passwords or hashes.
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const TABLES=['accounts','password_reset_requests'];
function normalizeAccount(row){
 let permissions;
 try{permissions=JSON.parse(row.permissions||'[]')}catch{throw Error('permissions JSON tidak valid pada akun '+row.id)}
 if(!Array.isArray(permissions))throw Error('permissions bukan array pada akun '+row.id);
 if(!row.id||!row.username||!row.password_hash||!row.name)throw Error('Kolom wajib akun kosong');
 return [row.id,row.username,row.email||null,row.password_hash,row.name,row.role||'Pegawai',row.status||'Aktif',row.unit||'DITRENDUK',JSON.stringify(permissions),!!row.must_change_password];
}
function normalizeReset(row){
 if(!row.id||!row.account_id)throw Error('Permintaan reset tanpa ID/account ID');
 return [row.id,row.account_id,row.identity||row.requested_identity||'',row.status||'Menunggu',row.requested_at||null,row.resolved_at||null,row.resolved_by||null];
}
async function importAuth({db,pool,apply=false,log=console.log}){
 const accounts=db.prepare('SELECT * FROM accounts ORDER BY id').all();
 let resets=[];
 try{resets=db.prepare('SELECT * FROM password_reset_requests ORDER BY id').all()}catch(e){if(!String(e.message).includes('no such table'))throw e}
 const ids=new Set(accounts.map(a=>a.id));
 for(const r of resets)if(!ids.has(r.account_id))throw Error('Permintaan reset memiliki account_id tidak ditemukan di SQLite');
 const mappedAccounts=accounts.map(normalizeAccount),mappedResets=resets.map(normalizeReset);
 log(`Sumber SQLite: ${accounts.length} akun, ${resets.length} permintaan reset.`);
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  // Fail on username collision with a different ID, preventing silent identity swaps.
  const pgUsers=await client.query('SELECT id,username,email FROM accounts');
  const byUsername=new Map(pgUsers.rows.map(x=>[String(x.username).toLowerCase(),x.id]));
  const byEmail=new Map(pgUsers.rows.filter(x=>x.email).map(x=>[String(x.email).toLowerCase(),x.id]));
  for(const a of accounts){
   if(byUsername.has(a.username.toLowerCase())&&byUsername.get(a.username.toLowerCase())!==a.id)throw Error('Konflik username PostgreSQL (ID berbeda): '+a.username);
   if(a.email&&byEmail.has(a.email.toLowerCase())&&byEmail.get(a.email.toLowerCase())!==a.id)throw Error('Konflik email PostgreSQL (ID berbeda) pada akun: '+a.id);
  }
  const pgIds=new Set(pgUsers.rows.map(x=>x.id));
  const existingResets=await client.query('SELECT id FROM password_reset_requests');
  const resetIds=new Set(existingResets.rows.map(x=>x.id));
  log(`Akun baru: ${accounts.filter(x=>!pgIds.has(x.id)).length}; sudah ada: ${accounts.filter(x=>pgIds.has(x.id)).length}.`);
  log(`Reset baru: ${resets.filter(x=>!resetIds.has(x.id)).length}; sudah ada: ${resets.filter(x=>resetIds.has(x.id)).length}.`);
  if(apply){
   for(const a of mappedAccounts)await client.query(`INSERT INTO accounts
    (id,username,email,password_hash,name,role,status,unit,permissions,must_change_password)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) ON CONFLICT(id) DO NOTHING`,a);
   for(const x of mappedResets)await client.query(`INSERT INTO password_reset_requests
    (id,account_id,requested_identity,status,requested_at,resolved_at,resolved_by)
    VALUES ($1,$2,$3,$4,COALESCE($5::timestamptz,now()),$6::timestamptz,$7)
    ON CONFLICT(id) DO NOTHING`,x);
   await client.query('COMMIT');
   log('PASS: impor PostgreSQL berhasil, akun yang sudah ada tidak diubah.');
  }else{
   await client.query('ROLLBACK');
   log('DRY RUN: tidak ada data PostgreSQL yang diubah. Untuk impor, backup kedua database lalu set CONFIRM_AUTH_IMPORT=YES.');
  }
  return {accounts:accounts.length,resets:resets.length,applied:apply};
 }catch(e){await client.query('ROLLBACK');throw e}
 finally{client.release()}
}
async function main(){
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL wajib');
 const sqlitePath=path.resolve(process.env.SQLITE_SOURCE_PATH||path.resolve(__dirname,'../backend/data/editrenduk.sqlite'));
 if(!fs.existsSync(sqlitePath))throw Error('SQLite sumber tidak ditemukan: '+sqlitePath);
 const apply=process.env.CONFIRM_AUTH_IMPORT==='YES';
 const db=new DatabaseSync(sqlitePath,{readOnly:true});
 const {Pool}=require('pg');
 const pool=new Pool({connectionString:process.env.DATABASE_URL,password:process.env.PGPASSWORD||undefined});
 try{await importAuth({db,pool,apply})}finally{db.close();await pool.end()}
}
if(require.main===module)main().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1});
module.exports={importAuth,normalizeAccount,normalizeReset};
