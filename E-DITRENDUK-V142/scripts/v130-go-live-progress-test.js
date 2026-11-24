#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {run}=require('./v130-go-live-progress');
const env={NODE_ENV:'production'};
async function tests(){
 const all={localRelease:()=>true,validate:()=>[],dependencies:async()=>({ok:true}),accounts:async()=>({ok:true}),logins:async()=>({ok:true})};
 const complete=await run(env,all);assert.equal(complete.verifiedPercent,100);assert.equal(complete.ok,true);
 const missing=await run(env,{...all,validate:()=>['missing']});assert.equal(missing.verifiedPercent,20);assert.deepEqual(missing.evidence.map(x=>x.status),['lulus','terblokir','terblokir','terblokir','terblokir']);
 const db=await run(env,{...all,dependencies:async()=>({ok:false})});assert.equal(db.verifiedPercent,40);assert.deepEqual(db.evidence.slice(2).map(x=>x.status),['gagal','terblokir','terblokir']);
 const account=await run(env,{...all,accounts:async()=>({ok:false})});assert.equal(account.verifiedPercent,60);
 const roles=await run(env,{...all,logins:async()=>({ok:false})});assert.equal(roles.verifiedPercent,80);
 const source=await run(env,{...all,localRelease:()=>false});assert.equal(source.verifiedPercent,80);assert.equal(source.ok,false);
 const exception=await run(env,{...all,dependencies:async()=>{throw Error('Sensitive credential example');}});assert.equal(exception.verifiedPercent,40);assert.doesNotMatch(JSON.stringify(exception),/Sensitive credential/);
 console.log('PASS V130: kemajuan 0-100% dari gate nyata; kegagalan berantai dan rahasia tidak bocor.');
}
if(require.main===module)tests().catch(e=>{console.error(e);process.exitCode=1});
module.exports={tests};
