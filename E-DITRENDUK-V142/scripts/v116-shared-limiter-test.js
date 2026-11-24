'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createSharedLimiter}=require('../backend/postgres-shared-limiter');
const {createApp}=require('../server-postgres');
(async()=>{
 const counts=new Map();
 const pool={async query(sql,args){
  assert.match(sql,/ON CONFLICT \(scope_key,bucket\) DO UPDATE/);
  const key=args.slice(0,2).join(':');const count=(counts.get(key)||0)+1;counts.set(key,count);
  return {rows:[{count}]};
 }};
 let now=100000;
 const a=createSharedLimiter(pool,{prefix:'login',limit:2,windowMs:1000,now:()=>now});
 const b=createSharedLimiter(pool,{prefix:'login',limit:2,windowMs:1000,now:()=>now});
 assert.equal(await a.allow('employee'),true);
 assert.equal(await b.allow('employee'),true);
 assert.equal(await a.allow('employee'),false);
 assert.equal(await a.allow('other'),true);
 now+=1000;assert.equal(await b.allow('employee'),true);
 const distinct=createSharedLimiter(pool,{prefix:'upload',limit:2,windowMs:1000,now:()=>now});
 assert.equal(await distinct.allow('employee'),true);
 assert.equal(fs.readFileSync(require('node:path').join(__dirname,'../postgres/schema.sql'),'utf8').includes('CREATE TABLE IF NOT EXISTS ed_request_limits'),true);
 const server=fs.readFileSync(require('node:path').join(__dirname,'../server-postgres.js'),'utf8');
 assert.match(server,/loginIpLimiter\.allow\(/);assert.match(server,/loginIdentityLimiter\.allow\(/);assert.match(server,/photoUploadLimiter\.allow\(user\.id\)/);assert.match(server,/resetLimiter\.allow\(key\)/);
 assert.match(server,/uploadLimiter\.allow\(accountId\)/);assert.doesNotMatch(server,/const attempts=new Map/);
 assert.equal(typeof createApp,'function');
 console.log('PASS shared PG limiter: cross-instance counter, scope separation, account separation, window reset, integration');
})().catch(e=>{console.error(e);process.exitCode=1});
