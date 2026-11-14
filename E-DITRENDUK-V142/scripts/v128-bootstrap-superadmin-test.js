#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {bootstrap,config,validPassword,CONFIRM}=require('./v128-bootstrap-superadmin');
const env={DATABASE_URL:'postgresql://example.invalid/db',BOOTSTRAP_CONFIRM:CONFIRM,BOOTSTRAP_ADMIN_USERNAME:'admin_first',BOOTSTRAP_ADMIN_NAME:'Administrator',BOOTSTRAP_ADMIN_PASSWORD:'Secur3!Long!OneTime'};
assert.equal(validPassword('Password123!'),false);
assert.equal(validPassword('Strong!SecretPhrase123'),true);
assert.equal(config({...env,BOOTSTRAP_CONFIRM:'wrong'}).length,1);
assert.equal(config({...env,BOOTSTRAP_ADMIN_PASSWORD:'short'}).length,1);
async function simulate(n=0,failed=false){
 const calls=[];let ended=false;
 const client={query:async(sql,args)=>{calls.push([sql,args]);if(failed&&/^INSERT/.test(sql))throw Error('mock database failure');if(/^SELECT COUNT/.test(sql))return {rows:[{n}]};return {rows:[]}},end:async()=>{ended=true;}};
 const result=await bootstrap(env,{connect:async()=>client});
 return {result,calls,ended};
}
(async()=>{
 const fresh=await simulate();assert.equal(fresh.result.ok,true);assert.equal(fresh.ended,true);
 assert(fresh.calls.some(([q])=>q==='COMMIT'));
 const insert=fresh.calls.find(([q])=>q.startsWith('INSERT'));assert(insert);
 assert(!JSON.stringify(insert).includes(env.BOOTSTRAP_ADMIN_PASSWORD));
 assert(insert[1][2].includes(':'));assert.equal(insert[1][2].split(':')[1].length,128);
 assert.equal(JSON.parse(insert[1][4]).includes('pengguna'),true);
 const existing=await simulate(2);assert.equal(existing.result.ok,false);assert.equal(existing.result.stage,'already-initialized');assert(!existing.calls.some(([q])=>q.startsWith('INSERT')));
 const fail=await simulate(0,true);assert.equal(fail.result.ok,false);assert(fail.calls.some(([q])=>q==='ROLLBACK'));
 const denied=await bootstrap({...env,BOOTSTRAP_CONFIRM:'NO'},{connect:async()=>{throw Error('must not connect')}});assert.equal(denied.stage,'configuration');
 console.log('PASS V128: one-time bootstrap, empty database, confirmation, strong password, rollback, no secret leakage');
})().catch(e=>{console.error(e);process.exitCode=1});
