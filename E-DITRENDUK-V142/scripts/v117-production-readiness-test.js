'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {REQUIRED_TABLES,validateProductionEnvironment,checkPostgresReadiness}=require('../backend/postgres-production-readiness');
const {createApp}=require('../server-postgres');
const env={NODE_ENV:'production',APP_ORIGIN:'https://portal.intranet.go.id',DATABASE_URL:'postgresql://employee:strong-secret@db.intranet.go.id:5432/app',NOTULEN_STORAGE_PROVIDER:'supabase',SUPABASE_URL:'https://project-name.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'eyJhbGciOiJIUzI1NiJ9.test-signature',SUPABASE_STORAGE_BUCKET:'notulen-private',AGENDA_STORAGE_BUCKET:'agenda-private'};
(async()=>{
 assert.deepEqual(validateProductionEnvironment(env),[]);
 for(const change of [{APP_ORIGIN:'http://localhost:3000'},{DATABASE_URL:'sqlite:demo'},{SUPABASE_SERVICE_ROLE_KEY:''},{AGENDA_STORAGE_BUCKET:''},{NOTULEN_STORAGE_PROVIDER:'local'}])assert(validateProductionEnvironment({...env,...change}).length>0);
 assert.equal(validateProductionEnvironment({NODE_ENV:'development'}).length,0);
 const schema=fs.readFileSync(path.join(__dirname,'../postgres/schema.sql'),'utf8');
 for(const name of REQUIRED_TABLES)assert(new RegExp('CREATE TABLE(?: IF NOT EXISTS)? '+name+'\\b').test(schema),`Missing schema table ${name}`);
 const migration=fs.readFileSync(path.join(__dirname,'../postgres/migrations/v117-profile-photos.sql'),'utf8');
 assert.match(migration,/CREATE TABLE IF NOT EXISTS ed_profile_photos/);
 const pool={query:async(sql,args)=>{assert.match(sql,/to_regclass/);assert.deepEqual(args[0],REQUIRED_TABLES);return {rows:[]};}};
 assert.deepEqual(await checkPostgresReadiness(pool),{ok:true,missing:[]});
 assert.deepEqual(await checkPostgresReadiness({query:async()=>({rows:[{name:'auth_sessions'}]})}),{ok:false,missing:['auth_sessions']});
 const server=createApp({pool});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base=`http://127.0.0.1:${server.address().port}`;
  const good=await fetch(base+'/api/ready');assert.equal(good.status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
 const fail=createApp({pool:{query:async()=>({rows:[{name:'ed_profile_photos'}]})}});await new Promise(resolve=>fail.listen(0,'127.0.0.1',resolve));
 try{const r=await fetch(`http://127.0.0.1:${fail.address().port}/api/ready`);assert.equal(r.status,503);assert.deepEqual((await r.json()).missingTables,['ed_profile_photos']);}finally{await new Promise(resolve=>fail.close(resolve));}
 assert.match(fs.readFileSync(path.join(__dirname,'../api/index.js'),'utf8'),/validateProductionEnvironment/);
 assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'../scripts/deploy-config-check.js'),'utf8'),/Runtime V18 hanya mendukung/);
 console.log(`PASS V117 production readiness: ${REQUIRED_TABLES.length} tables, missing migration blocks readiness, configuration fail-closed, Vercel config protected`);
})().catch(e=>{console.error(e);process.exitCode=1});
