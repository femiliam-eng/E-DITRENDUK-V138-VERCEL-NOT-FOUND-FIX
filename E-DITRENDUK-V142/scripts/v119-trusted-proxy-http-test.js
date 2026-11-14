'use strict';
const assert=require('node:assert/strict');
const {createApp,clientIp}=require('../server-postgres');
(async()=>{
 const makeReq=(remote,header)=>({socket:{remoteAddress:remote},headers:{'x-real-ip':header}});
 const env={TRUSTED_PROXY_IPS:'127.0.0.1'};
 assert.equal(clientIp(makeReq('203.0.113.15','198.51.100.2'),env),'203.0.113.15','untrusted spoof ignored');
 assert.equal(clientIp(makeReq('127.0.0.1','198.51.100.2'),env),'198.51.100.2');
 assert.equal(clientIp(makeReq('127.0.0.1','198.51.100.2, 1.2.3.4'),env),'127.0.0.1','reject lists');
 assert.equal(clientIp(makeReq('127.0.0.1','not-an-ip'),env),'127.0.0.1','reject malformed IP');
 const old=process.env.TRUSTED_PROXY_IPS;process.env.TRUSTED_PROXY_IPS='127.0.0.1';
 const counters=new Map();let reads=0;
 const pool={async query(sql,args){
  if(sql.includes('INSERT INTO ed_request_limits')){const k=args[0]+':'+args[1];const count=(counters.get(k)||0)+1;counters.set(k,count);return {rows:[{count}]};}
  if(sql.includes('FROM accounts WHERE lower(username)')){reads++;return {rows:[]};}
  throw Error('Unexpected SQL: '+sql.slice(0,80));
 }};
 const server=createApp({pool});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/api/auth/login`;
 const post=(username,ip)=>fetch(base,{method:'POST',headers:{'Content-Type':'application/json','X-Real-IP':ip},body:JSON.stringify({username,password:'WrongPass123'})});
 try{
  for(let i=0;i<30;i++)assert.equal((await post('employee-'+i,'198.51.100.10')).status,401);
  assert.equal((await post('employee-31','198.51.100.10')).status,429,'same client blocked');
  assert.equal((await post('employee-32','198.51.100.11')).status,401,'separate employee IP not globally blocked');
  assert.equal(reads,31);
  console.log('PASS V119: trusted proxy client isolation, block spoofed/untrusted headers, HTTP rate limit per client');
 }finally{await new Promise(resolve=>server.close(resolve));if(old===undefined)delete process.env.TRUSTED_PROXY_IPS;else process.env.TRUSTED_PROXY_IPS=old;}
})().catch(e=>{console.error(e);process.exitCode=1});
