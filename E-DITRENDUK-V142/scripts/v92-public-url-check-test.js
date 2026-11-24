'use strict';
const assert=require('node:assert/strict');
const {run}=require('./v92-public-url-check');
(async()=>{
 const mock=async u=>({status:u.endsWith('/api/ready')?503:200});
 const result=await run('https://staging.example.org',mock);
 assert.equal(result.ok,false);assert.equal(result.results[2].status,503);
 await assert.rejects(()=>run('http://example.org',mock),/HTTPS/);
 await assert.rejects(()=>run('https://u:p@example.org',mock),/HTTPS/);
 const pass=await run('https://staging.example.org',async()=>({status:200}));assert.equal(pass.ok,true);
 console.log('V92 URL smoke contract PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
