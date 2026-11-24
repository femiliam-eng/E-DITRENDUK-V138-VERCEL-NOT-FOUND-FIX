'use strict';
const assert=require('node:assert/strict');
const {run,checkCounts,inspectAccounts}=require('./v126-employee-go-live-gate');
const good={NODE_ENV:'production',APP_ORIGIN:'https://portal.instansi.go.id/',DATABASE_URL:'postgresql://appuser:real-password@db.instansi.go.id/editrenduk',NOTULEN_STORAGE_PROVIDER:'supabase',SUPABASE_URL:'https://realproject.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'eyJhbGciOiJIUzI1NiJ9.valid-key-data',SUPABASE_STORAGE_BUCKET:'notulen-private',AGENDA_STORAGE_BUCKET:'agenda-private'};
const account={admins:1,employees:3,active_accounts:4,missing_hashes:0};
const data={monitoring:12,agenda:2,tasks:9,fasilitasi:1};
let queries=[];
function connect(a=account,d=data){return async()=>({query:async(sql)=>{queries.push(sql);if(sql.includes('WITH missing_tables'))return {rows:[]};if(sql.includes('FROM accounts'))return {rows:[a]};if(sql.includes('FROM monitoring'))return {rows:[d]};throw Error('Unexpected query');},end:async()=>{}})}
const fetchImpl=async(url)=>({ok:true,status:200,json:async()=>({name:decodeURIComponent(String(url).split('/').at(-1)),public:false})});
const urlCheck=async()=>({ok:true,results:[{route:'/login.html',ok:true}]});
(async()=>{
 const success=await run(good,{connect:connect(),fetchImpl,urlCheck});assert.equal(success.ok,true);assert.equal(success.employee.counts.pegawaiAktif,3);assert(queries.some(q=>q.includes("role='Superadmin'")));
 for(const [value,expected] of [[{...account,admins:0},'Superadmin'],[{...account,employees:0},'Pegawai'],[{...account,missing_hashes:1},'password hash']]){
  const denied=await run(good,{connect:connect(value),fetchImpl,urlCheck});assert.equal(denied.ok,false);assert.equal(denied.stage,'employee-accounts');assert(denied.issues.join().includes(expected));
 }
 const notLive=await run(good,{connect:connect(),fetchImpl,urlCheck:async()=>({ok:false,results:[]})});assert.equal(notLive.ok,false);assert.equal(notLive.stage,'public-url');
 const noDb=await run(good,{connect:async()=>{throw Error('private-secret-123')},fetchImpl,urlCheck});assert.equal(noDb.ok,false);assert(!JSON.stringify(noDb).includes('private-secret-123'));
 const badEnv=await run({...good,DATABASE_URL:'postgres://user:REPLACE_PASSWORD@db.example.invalid/db'},{connect:connect(),fetchImpl,urlCheck});assert.equal(badEnv.ok,false);assert.equal(badEnv.stage,'configuration');
 assert.throws(()=>checkCounts({...account,admins:NaN},data),/tidak valid/);
 const fake=await inspectAccounts(await connect()());assert.equal(fake.counts.monitoring,12);
 console.log('PASS V126: actual employee/admin readiness, no accounts, no hash, missing URL, unreachable database, invalid config, counts validation (9 scenarios)');
})().catch(e=>{console.error(e);process.exitCode=1});
