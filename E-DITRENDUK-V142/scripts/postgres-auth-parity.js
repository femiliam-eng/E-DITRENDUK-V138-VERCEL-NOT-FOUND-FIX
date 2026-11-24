'use strict';
// Read-only post-import parity check. Does not expose password hashes.
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
function canonicalPermissions(x){
 const parsed=typeof x==='string'?JSON.parse(x):x;
 if(!Array.isArray(parsed))throw Error('Format hak akses tidak valid');
 return JSON.stringify([...new Set(parsed.map(String))].sort());
}
function parity(local,remote){
 const differences=[];
 const a=new Map(remote.accounts.map(x=>[String(x.id),x]));
 for(const l of local.accounts){
  const p=a.get(String(l.id));
  if(!p){differences.push({type:'account_missing',id:l.id});continue}
  for(const field of ['username','email','name','role','status','unit']){
   if(String(l[field]??'')!==String(p[field]??''))differences.push({type:'account_field_mismatch',id:l.id,field});
  }
  if(String(l.password_hash)!==String(p.password_hash))differences.push({type:'password_hash_mismatch',id:l.id});
  if(Boolean(l.must_change_password)!==Boolean(p.must_change_password))differences.push({type:'must_change_password_mismatch',id:l.id});
  try{if(canonicalPermissions(l.permissions)!==canonicalPermissions(p.permissions))differences.push({type:'permissions_mismatch',id:l.id})}
  catch{differences.push({type:'permissions_invalid',id:l.id})}
 }
 const resets=new Map(remote.resets.map(x=>[String(x.id),x]));
 for(const l of local.resets){
  const p=resets.get(String(l.id));
  if(!p){differences.push({type:'reset_missing',id:l.id});continue}
  if(String(l.account_id)!==String(p.account_id)||String(l.status)!==String(p.status))
   differences.push({type:'reset_mismatch',id:l.id});
 }
 return {ok:differences.length===0,localAccounts:local.accounts.length,pgAccounts:remote.accounts.length,localResets:local.resets.length,pgResets:remote.resets.length,differences};
}
async function verify({db,pool}){
 const local={accounts:db.prepare('SELECT * FROM accounts').all(),resets:[]};
 try{local.resets=db.prepare('SELECT * FROM password_reset_requests').all()}catch(e){if(!String(e.message).includes('no such table'))throw e}
 const {rows:accounts}=await pool.query('SELECT id,username,email,name,role,status,unit,permissions,password_hash,must_change_password FROM accounts');
 const {rows:resets}=await pool.query('SELECT id,account_id,status FROM password_reset_requests');
 return parity(local,{accounts,resets});
}
async function main(){
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL wajib');
 const source=path.resolve(process.env.SQLITE_SOURCE_PATH||path.join(__dirname,'../backend/data/editrenduk.sqlite'));
 if(!fs.existsSync(source))throw Error('SQLite sumber tidak ditemukan: '+source);
 const {Pool}=require('pg');
 const pool=new Pool({connectionString:process.env.DATABASE_URL,password:process.env.PGPASSWORD||undefined});
 const db=new DatabaseSync(source,{readOnly:true});
 try{
  const result=await verify({db,pool});
  // IDs and field names only; never print passwords, hashes, emails or names.
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=2;
 }finally{db.close();await pool.end()}
}
if(require.main===module)main().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1});
module.exports={parity,verify,canonicalPermissions};
