'use strict';
const assert=require('node:assert/strict');
const {createApp}=require('../server-postgres');
(async()=>{
 const counters=new Map();let accountReads=0;
 const pool={async query(sql,args){
  if(sql.includes('INSERT INTO ed_request_limits')){
   const k=args[0]+':'+args[1];const count=(counters.get(k)||0)+1;counters.set(k,count);return {rows:[{count}]};
  }
  if(sql.includes('FROM accounts WHERE lower(username)')){accountReads++;return {rows:[]};}
  throw Error('Unexpected SQL during rate-limit test');
 }};
 const server=createApp({pool});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}/api/auth/login`;
 const post=(username)=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password:'WrongPass123'})});
 try{
  for(let i=0;i<30;i++){const r=await post('user-'+i);assert.equal(r.status,401,`attempt ${i}`);}
  const denied=await post('new-user-31');assert.equal(denied.status,429,'IP rate limit must block username rotation');
  assert.equal(accountReads,30,'blocked request must not query employee accounts');
  const failedCount=counters.size;assert(failedCount>=32,'both IP and identity counters must be maintained');
  console.log('PASS V118 HTTP: 30 unique usernames share IP budget; next attempt 429; blocked login does not query accounts');
 }finally{await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
