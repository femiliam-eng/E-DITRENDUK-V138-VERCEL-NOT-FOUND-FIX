#!/usr/bin/env node
'use strict';
// Read-only live gate. Does not read employee records, upload objects, or mutate database.
const {validateProductionEnvironment,checkPostgresReadiness}=require('../backend/postgres-production-readiness');
const BUCKET_NAMES=['SUPABASE_STORAGE_BUCKET','AGENDA_STORAGE_BUCKET'];
function safeResult(name,ok,message){return {name,ok:Boolean(ok),message};}
async function checkBucket(env,name,{fetchImpl=globalThis.fetch,timeoutMs=8000}={}){
 const bucket=env[name];
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),timeoutMs);
 try{
  const url=new URL('/storage/v1/bucket/'+encodeURIComponent(bucket),env.SUPABASE_URL);
  const response=await fetchImpl(url,{method:'GET',redirect:'error',signal:ctrl.signal,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,Accept:'application/json'}});
  if(!response.ok)return safeResult(name,false,'Storage menolak pemeriksaan bucket (HTTP '+response.status+').');
  const body=await response.json();
  if(body?.name!==bucket&&body?.id!==bucket)return safeResult(name,false,'Identitas bucket tidak sesuai.');
  if(body.public!==false)return safeResult(name,false,'Bucket tidak dikonfirmasi PRIVATE.');
  return safeResult(name,true,'Bucket ada, dapat diakses dan PRIVATE.');
 }catch{return safeResult(name,false,'Koneksi Storage gagal/timeout atau respons tidak valid.');}
 finally{clearTimeout(timer);}
}
async function run(env=process.env,{connect,fetchImpl=globalThis.fetch}={}){
 const checks=[];
 const config=validateProductionEnvironment({...env,NODE_ENV:'production'});
 if(config.length)return {ok:false,checks:[safeResult('production-config',false,config.join(' '))],note:'Tidak ada koneksi keluar ketika konfigurasi belum aman.'};
 checks.push(safeResult('production-config',true,'Bentuk konfigurasi produksi valid.'));
 let client;
 try{
  if(connect)client=await connect(env);
  else{const {Client}=require('pg');client=new Client({connectionString:env.DATABASE_URL,connectionTimeoutMillis:8000,query_timeout:10000,statement_timeout:10000});await client.connect();}
  const result=await checkPostgresReadiness(client);
  checks.push(safeResult('postgres-schema',result.ok,result.ok?'18 tabel dan 35 kolom penting tersedia.':'Skema belum lengkap: '+result.missing.join(', ').slice(0,400)));
 }catch{checks.push(safeResult('postgres-schema',false,'PostgreSQL tidak dapat dihubungi atau query readiness gagal.'));}
 finally{if(client?.end)await client.end().catch(()=>{});}
 for(const name of BUCKET_NAMES)checks.push(await checkBucket(env,name,{fetchImpl}));
 return {ok:checks.every(x=>x.ok),checks,note:'Read-only: tes kredensial, tabel/kolom, keberadaan dan privasi bucket. Belum membuktikan CRUD, migrasi data, atau login karyawan.'};
}
if(require.main===module)run().then(report=>{console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;}).catch(()=>{console.error('Gagal menjalankan pemeriksaan dependensi.');process.exitCode=1;});
module.exports={run,checkBucket,BUCKET_NAMES};
