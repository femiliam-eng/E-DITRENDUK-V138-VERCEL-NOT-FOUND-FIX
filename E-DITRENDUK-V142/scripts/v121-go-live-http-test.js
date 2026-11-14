'use strict';
const assert=require('node:assert/strict');
const {createApp}=require('../server-postgres');
const {run}=require('./v121-go-live-smoke');
(async()=>{
 const pool={query:async(sql)=>{if(sql.includes('to_regclass'))return {rows:[]};throw Error('Unexpected SQL '+sql)}};
 const server=createApp({pool});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const origin=`http://127.0.0.1:${server.address().port}/`;
  const result=await run(origin,{allowLocal:true});
  assert.equal(result.ok,true,JSON.stringify(result.results));
  console.log('PASS V121 live HTTP smoke against PostgreSQL-only runtime: 8 endpoint checks');
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1});
