'use strict';
// Non-destructive PostgreSQL-only hosting preflight; never print secrets.
const {validateProductionEnvironment}=require('../backend/postgres-production-readiness');
function assess(env){
 const checks=[];
 const add=(name,ok,detail)=>checks.push({name,ok:Boolean(ok),detail});
 add('Mode runtime production',env.NODE_ENV==='production','Set NODE_ENV=production di hosting');
 const errors=validateProductionEnvironment({...env,NODE_ENV:'production'});
 add('PostgreSQL-only production config',errors.length===0,errors.length?errors.join(' '):'APP_ORIGIN HTTPS, DATABASE_URL PostgreSQL online, dan Supabase Storage terkonfigurasi');
 // Runtime PostgreSQL uses hashed sessions in auth_sessions, not the legacy SQLite SESSION_SECRET.
 // Do not require PG_PRIMARY_* flags: they were part of the retired dual-database runtime.
 const passed=checks.filter(x=>x.ok).length;
 return {ready:passed===checks.length,passed,total:checks.length,checks,warning:'Hasil ini memvalidasi environment saja; tes PostgreSQL, storage privat, migrasi, dan URL publik masih wajib.'};
}
if(require.main===module){const result=assess(process.env);console.log(JSON.stringify(result,null,2));if(!result.ready)process.exitCode=2}
module.exports={assess};
