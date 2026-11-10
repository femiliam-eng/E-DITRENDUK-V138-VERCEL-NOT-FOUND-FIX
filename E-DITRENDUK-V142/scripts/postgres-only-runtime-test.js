'use strict';
const assert=require('node:assert/strict');
const {createApp}=require('../server-postgres');
const mock={query:async(sql)=>{if(sql==='SELECT 1'||sql==='SELECT 1 FROM ed_request_limits LIMIT 0')return {rows:[{'?column?':1}]};if(sql.includes('to_regclass'))return {rows:[]};if(sql.includes('INSERT INTO ed_request_limits'))return {rows:[{count:1}]};if(sql.includes('FROM accounts WHERE status='))return {rows:[]};throw Error('Unexpected SQL '+sql)}};
(async()=>{
 const app=createApp({pool:mock});await new Promise(r=>app.listen(0,'127.0.0.1',r));
 try{
  const root=`http://127.0.0.1:${app.address().port}`;
  let res=await fetch(root+'/api/ready');assert.equal(res.status,200);assert.equal((await res.json()).driver,'postgresql');
  res=await fetch(root+'/api/auth/me');assert.equal(res.status,401);
  res=await fetch(root+'/api/auth/forgot-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identity:'unknown@example.org'})});assert.equal(res.status,200);assert.match((await res.json()).message,/Jika akun ditemukan/);
  res=await fetch(root+'/landing.html');assert.equal(res.status,200);
  res=await fetch(root+'/api/unknown');assert.equal(res.status,401);
  console.log('PASS PostgreSQL-only runtime: readiness, auth fail closed, forgot-password privacy, static, unknown route');
 }finally{await new Promise(r=>app.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
