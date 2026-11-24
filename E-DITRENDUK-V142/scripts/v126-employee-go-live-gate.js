#!/usr/bin/env node
'use strict';
// V126: Read-only go-live acceptance; no employee records, passwords, tokens or keys in output.
const {run:checkDependencies}=require('./v125-live-dependencies');
const {run:checkUrl}=require('./v121-go-live-smoke');
const {validateProductionEnvironment}=require('../backend/postgres-production-readiness');

const ACCOUNT_COUNTS_SQL=`SELECT
 COUNT(*) FILTER (WHERE role='Superadmin' AND status='Aktif')::int AS admins,
 COUNT(*) FILTER (WHERE role='Pegawai' AND status='Aktif')::int AS employees,
 COUNT(*) FILTER (WHERE status='Aktif')::int AS active_accounts,
 COUNT(*) FILTER (WHERE status='Aktif' AND (password_hash IS NULL OR password_hash=''))::int AS missing_hashes
 FROM accounts`;
const DATA_COUNTS_SQL=`SELECT
 (SELECT COUNT(*) FROM monitoring)::int AS monitoring,
 (SELECT COUNT(*) FROM agenda_kegiatan)::int AS agenda,
 (SELECT COUNT(*) FROM task_deadline)::int AS tasks,
 (SELECT COUNT(*) FROM fasilitasi)::int AS fasilitasi`;
function checkCounts(accounts,data){
 const ints=['admins','employees','active_accounts','missing_hashes'];
 if(!ints.every(k=>Number.isSafeInteger(accounts?.[k])&&accounts[k]>=0))throw Error('Respons jumlah akun tidak valid');
 if(!['monitoring','agenda','tasks','fasilitasi'].every(k=>Number.isSafeInteger(data?.[k])&&data[k]>=0))throw Error('Respons jumlah data tidak valid');
 const issues=[];
 if(accounts.admins<1)issues.push('Belum ada akun Superadmin aktif.');
 if(accounts.employees<1)issues.push('Belum ada akun Pegawai aktif.');
 if(accounts.missing_hashes>0)issues.push('Ada akun aktif tanpa password hash.');
 return {ok:issues.length===0,issues,counts:{superadminAktif:accounts.admins,pegawaiAktif:accounts.employees,akunAktif:accounts.active_accounts,monitoring:data.monitoring,agenda:data.agenda,task:data.tasks,fasilitasi:data.fasilitasi},dataNote:'Jumlah data hanya diagnostik; kelengkapan data sumber asli wajib divalidasi oleh PIC.'};
}
async function inspectAccounts(client){
 const result=await client.query(ACCOUNT_COUNTS_SQL);
 const data=await client.query(DATA_COUNTS_SQL);
 return checkCounts(result.rows?.[0],data.rows?.[0]);
}
async function run(env=process.env,{connect,fetchImpl=globalThis.fetch,urlCheck=checkUrl}={}){
 const errors=validateProductionEnvironment({...env,NODE_ENV:'production'});
 if(errors.length)return {ok:false,stage:'configuration',issues:errors};
 const deps=await checkDependencies({...env,NODE_ENV:'production'},{connect,fetchImpl});
 if(!deps.ok)return {ok:false,stage:'dependencies',checks:deps.checks};
 let client;
 let accounts;
 try{
  client=connect?await connect(env):new (require('pg').Client)({connectionString:env.DATABASE_URL,connectionTimeoutMillis:8000,query_timeout:10000,statement_timeout:10000});
  if(!connect)await client.connect();
  accounts=await inspectAccounts(client);
 }catch{return {ok:false,stage:'employee-accounts',issues:['Pemeriksaan akun/data PostgreSQL gagal; tidak dinyatakan siap.']};}
 finally{if(client?.end)await client.end().catch(()=>{});}
 if(!accounts.ok)return {ok:false,stage:'employee-accounts',...accounts};
 // URL verification is mandatory, not optional. Avoid claiming live on internal-only tests.
 try{
  const url=await urlCheck(env.APP_ORIGIN,{fetchImpl});
  return {ok:url.ok,stage:url.ok?'all-gates-passed':'public-url',employee:accounts,publicUrl:url,note:'Lulus tiga gate teknis bukan persetujuan produksi. Uji login 2 peran, dokumen, kelengkapan data, backup/restore dan keamanan tetap wajib.'};
 }catch{return {ok:false,stage:'public-url',employee:accounts,issues:['URL HTTPS belum terbukti dapat diakses dan aman.']};}
}
if(require.main===module)run().then(report=>{console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;}).catch(()=>{console.error('Go-live gate gagal; cek konfigurasi dan konektivitas tanpa mencetak secret.');process.exitCode=1;});
module.exports={run,inspectAccounts,checkCounts,ACCOUNT_COUNTS_SQL,DATA_COUNTS_SQL};
