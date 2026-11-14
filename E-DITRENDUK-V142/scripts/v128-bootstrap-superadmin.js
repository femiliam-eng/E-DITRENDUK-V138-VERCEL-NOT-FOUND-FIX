#!/usr/bin/env node
'use strict';
// One-time, explicitly authorized bootstrap for an EMPTY accounts table only.
// Credentials must be supplied through environment/secret manager; never logged.
const crypto=require('node:crypto');
const {scryptSync}=crypto;
const CONFIRM='CREATE_FIRST_SUPERADMIN_ON_EMPTY_DATABASE';
const MODULES=['beranda','repository','notulen','rakom','monitoring','jadwal','logbook','arsip','pengguna','agenda','task-deadline'];
const validPassword=p=>typeof p==='string'&&p.length>=14&&/[A-Z]/.test(p)&&/[a-z]/.test(p)&&/[0-9]/.test(p)&&/[^a-zA-Z0-9]/.test(p)&&!/(password|admin123|qwerty|123456)/i.test(p);
function config(env){
 const issues=[];
 if(env.BOOTSTRAP_CONFIRM!==CONFIRM)issues.push('Konfirmasi bootstrap tidak diberikan.');
 if(!/^postgres(?:ql)?:\/\//.test(env.DATABASE_URL||''))issues.push('DATABASE_URL PostgreSQL wajib diatur.');
 if(!/^[a-zA-Z0-9._-]{3,40}$/.test(env.BOOTSTRAP_ADMIN_USERNAME||''))issues.push('Username bootstrap tidak valid.');
 if(!env.BOOTSTRAP_ADMIN_NAME||env.BOOTSTRAP_ADMIN_NAME.trim().length>150)issues.push('Nama admin bootstrap wajib diatur.');
 if(!validPassword(env.BOOTSTRAP_ADMIN_PASSWORD))issues.push('Kata sandi bootstrap harus >=14 karakter, huruf besar, kecil, angka dan simbol.');
 return issues;
}
async function bootstrap(env=process.env,{connect}={}){
 const issues=config(env);if(issues.length)return {ok:false,stage:'configuration',issues};
 let client;
 try{
  client=connect?await connect(env):new (require('pg').Client)({connectionString:env.DATABASE_URL,connectionTimeoutMillis:8000,query_timeout:10000});
  if(!connect)await client.connect();
  await client.query('BEGIN');
  // Serializes competing bootstrap requests and checks again inside the lock.
  await client.query('SELECT pg_advisory_xact_lock($1)',[20261105]);
  const r=await client.query('SELECT COUNT(*)::int AS n FROM accounts');
  if(!Number.isSafeInteger(r.rows?.[0]?.n)||r.rows[0].n!==0){await client.query('ROLLBACK');return {ok:false,stage:'already-initialized',issues:['Database sudah memiliki akun; bootstrap tidak melakukan perubahan.']};}
  const salt=crypto.randomBytes(16).toString('hex');
  const hash=`${salt}:${scryptSync(env.BOOTSTRAP_ADMIN_PASSWORD,salt,64).toString('hex')}`;
  const id=`acc_${crypto.randomUUID()}`;
  await client.query(`INSERT INTO accounts(id,username,email,password_hash,name,role,status,unit,permissions,must_change_password)
   VALUES($1,$2,NULL,$3,$4,'Superadmin','Aktif','DITRENDUK',$5::jsonb,true)`,
   [id,env.BOOTSTRAP_ADMIN_USERNAME,hash,env.BOOTSTRAP_ADMIN_NAME.trim(),JSON.stringify(MODULES)]);
  await client.query('COMMIT');
  return {ok:true,stage:'created',note:'Superadmin pertama dibuat. Ganti password saat login pertama dan hapus secret bootstrap dari environment.'};
 }catch{
  if(client){try{await client.query('ROLLBACK');}catch{}}
  return {ok:false,stage:'database-error',issues:['Bootstrap gagal; koneksi atau skema perlu diperiksa tanpa mengungkap kredensial.']};
 }finally{if(client?.end)await client.end().catch(()=>{});}
}
if(require.main===module)bootstrap().then(r=>{console.log(JSON.stringify(r,null,2));if(!r.ok)process.exitCode=1;}).catch(()=>{console.error('Bootstrap gagal.');process.exitCode=1;});
module.exports={bootstrap,config,validPassword,CONFIRM};
