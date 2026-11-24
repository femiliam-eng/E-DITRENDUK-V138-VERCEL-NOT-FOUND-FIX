'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {REQUIRED_TABLES,REQUIRED_COLUMNS,checkPostgresReadiness}=require('../backend/postgres-production-readiness');
const {createApp}=require('../server-postgres');
(async()=>{
 const schema=fs.readFileSync(path.join(__dirname,'../postgres/schema.sql'),'utf8');
 assert.equal(REQUIRED_TABLES.length,18);
 assert(REQUIRED_COLUMNS.length>=30);
 for(const name of REQUIRED_COLUMNS){
  const [table,column]=name.split('.');
  assert(REQUIRED_TABLES.includes(table),`Unknown table: ${table}`);
  const section=schema.match(new RegExp('CREATE TABLE(?: IF NOT EXISTS)? '+table+'\\s*\\(([\\s\\S]*?)\\);'));
  assert(section,`No CREATE TABLE in schema for ${table}`);
  assert(new RegExp('\\b'+column+'\\s+(?:text|jsonb|boolean|bigint|integer|timestamptz|bytea)\\b').test(section[1]),`Schema lacks ${name}`);
 }
 let sql='';let args;
 const ok=await checkPostgresReadiness({query:async(q,a)=>{sql=q;args=a;return {rows:[]}}});
 assert.equal(ok.ok,true);assert.deepEqual(args,[REQUIRED_TABLES,REQUIRED_COLUMNS]);
 assert.match(sql,/pg_attribute/);assert.match(sql,/NOT a\.attisdropped/);
 const missing=['accounts.password_hash','ed_profile_photos.content'];
 assert.deepEqual(await checkPostgresReadiness({query:async()=>({rows:missing.map(name=>({name}))})}),{ok:false,missing});
 const server=createApp({pool:{query:async()=>({rows:[{name:'ed_profile_photos.content'}]})}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const res=await fetch(`http://127.0.0.1:${server.address().port}/api/ready`);assert.equal(res.status,503);const body=await res.json();assert.equal(body.ok,false);assert(body.missingTables.includes('ed_profile_photos.content'));}
 finally{await new Promise(resolve=>server.close(resolve));}
 console.log(`PASS V122 schema readiness: ${REQUIRED_TABLES.length} tables, ${REQUIRED_COLUMNS.length} critical columns; missing column blocks HTTP readiness`);
})().catch(e=>{console.error(e);process.exitCode=1});
