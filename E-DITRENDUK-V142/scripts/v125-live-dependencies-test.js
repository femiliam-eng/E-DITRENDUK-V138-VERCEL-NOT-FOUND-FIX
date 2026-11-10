'use strict';
const assert=require('node:assert/strict');
const {run}=require('./v125-live-dependencies');
const good={NODE_ENV:'production',APP_ORIGIN:'https://portal.instansi.go.id/',DATABASE_URL:'postgresql://user:validpass@db.instansi.go.id:5432/editrenduk',NOTULEN_STORAGE_PROVIDER:'supabase',SUPABASE_URL:'https://projectxyz.supabase.co/',SUPABASE_SERVICE_ROLE_KEY:'eyJhbGciOiJIUzI1NiJ9.abcDEF012345',SUPABASE_STORAGE_BUCKET:'notulen-private',AGENDA_STORAGE_BUCKET:'agenda-private'};
let queries=0,ended=0,requests=[];
const connect=async()=>({query:async(sql,params)=>{queries++;assert(params[0].includes('accounts'));assert(params[1].includes('accounts.password_hash'));return {rows:[]};},end:async()=>{ended++;}});
const fakeFetch=async(url,opts)=>{requests.push({url:String(url),opts});return {ok:true,status:200,json:async()=>({name:decodeURIComponent(String(url).split('/').at(-1)),public:false})};};
(async()=>{
 const a=await run(good,{connect,fetchImpl:fakeFetch});assert.equal(a.ok,true);assert.equal(queries,1);assert.equal(ended,1);assert.equal(requests.length,2);
 for(const r of requests){assert.equal(r.opts.method,'GET');assert.equal(r.opts.headers.Authorization,'Bearer '+good.SUPABASE_SERVICE_ROLE_KEY);assert.equal(r.opts.redirect,'error');}
 requests=[];const invalid=await run({...good,DATABASE_URL:'postgresql://test:REPLACE_PASSWORD@db.example.invalid/db'},{connect,fetchImpl:fakeFetch});assert.equal(invalid.ok,false);assert.equal(requests.length,0);
 const publicBucket=await run(good,{connect,fetchImpl:async(url)=>({ok:true,status:200,json:async()=>({name:String(url).split('/').at(-1),public:true})})});assert.equal(publicBucket.ok,false);
 const notFound=await run(good,{connect,fetchImpl:async()=>({ok:false,status:404})});assert.equal(notFound.ok,false);
 const malformed=await run(good,{connect,fetchImpl:async()=>({ok:true,status:200,json:async()=>({name:'wrong-bucket',public:false})})});assert.equal(malformed.ok,false);
 const dbFail=await run(good,{connect:async()=>{throw Error('sensitive-credential-string');},fetchImpl:fakeFetch});assert.equal(dbFail.ok,false);assert(!JSON.stringify(dbFail).includes('sensitive-credential-string'));
 const schemaMissing=await run(good,{connect:async()=>({query:async()=>({rows:[{name:'accounts.password_hash'}]}),end:async()=>{}}),fetchImpl:fakeFetch});assert.equal(schemaMissing.ok,false);assert(schemaMissing.checks.find(x=>x.name==='postgres-schema').message.includes('password_hash'));
 console.log('PASS V125: live DB/storage gate, private bucket, credential safety, no mutation, fail closed (7 scenarios)');
})().catch(e=>{console.error(e);process.exitCode=1});
