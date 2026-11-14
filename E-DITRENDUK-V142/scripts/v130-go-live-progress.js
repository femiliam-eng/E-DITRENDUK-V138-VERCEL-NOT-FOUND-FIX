#!/usr/bin/env node
'use strict';
// Evidence-based go-live gate. No changes to records or employee accounts; logout test sessions only.
// Percentages represent gates VERIFIED in this run, not estimates of source completion.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const {validateProductionEnvironment}=require('../backend/postgres-production-readiness');
const {run:checkDependencies}=require('./v125-live-dependencies');
const {run:checkAccountsAndUrl}=require('./v126-employee-go-live-gate');
const {run:checkLogin}=require('./v127-employee-login-smoke');
const GATES=Object.freeze([
 {id:'local-source',label:'Source dan regresi lokal'},
 {id:'production-config',label:'Konfigurasi hosting produksi'},
 {id:'live-dependencies',label:'PostgreSQL + Storage privat online'},
 {id:'accounts-and-url',label:'Akun aktif + URL HTTPS terverifikasi'},
 {id:'employee-roles',label:'Login, sesi, izin, logout dua peran'}
]);
function localRelease(){
 const root=path.resolve(__dirname,'..');
 const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run','release-check'],{
  cwd:root,env:{...process.env,NODE_ENV:'test'},encoding:'utf8',timeout:240000,maxBuffer:4*1024*1024
 });
 return result.status===0 && !result.error;
}
async function run(env=process.env,overrides={}){
 const runLocal=overrides.localRelease||localRelease;
 const productionValidation=overrides.validate||validateProductionEnvironment;
 const dependencies=overrides.dependencies||checkDependencies;
 const accounts=overrides.accounts||checkAccountsAndUrl;
 const logins=overrides.logins||checkLogin;
 const evidence=[];
 const push=(gate,status)=>evidence.push({id:gate.id,label:gate.label,status});
 const pass=async fn=>{try{return Boolean(await fn());}catch{return false;}};
 const local=await pass(runLocal);push(GATES[0],local?'lulus':'gagal');
 const configuration=await pass(()=>productionValidation({...env,NODE_ENV:'production'}).length===0);
 push(GATES[1],configuration?'lulus':'terblokir');
 // Never try connecting using missing/placeholder credentials.
 let previous=configuration;
 for(const [gate,fn] of [[GATES[2],()=>dependencies({...env,NODE_ENV:'production'})],[GATES[3],()=>accounts({...env,NODE_ENV:'production'})],[GATES[4],()=>logins(env)]]){
  if(!previous){push(gate,'terblokir');continue;}
  const ok=await pass(async()=> (await fn())?.ok===true);
  push(gate,ok?'lulus':'gagal');previous=ok;
 }
 const verified=evidence.filter(item=>item.status==='lulus').length;
 return {ok:verified===GATES.length,verified,total:GATES.length,verifiedPercent:100*verified/GATES.length,
  meaning:'Persentase gate GO-LIVE yang terbukti lulus saat pemeriksaan ini; BUKAN estimasi penyelesaian source.',
  evidence,blocked:evidence.filter(item=>item.status!=='lulus').map(x=>x.label),
  note:'Belum termasuk persetujuan PIC, validasi data organisasi, audit backup/restore, dan uji penerimaan karyawan di lapangan.'};
}
if(require.main===module)run().then(report=>{
 console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;
}).catch(()=>{console.error('Pemeriksaan go-live gagal (tanpa menampilkan secret).');process.exitCode=1;});
module.exports={run,GATES};
