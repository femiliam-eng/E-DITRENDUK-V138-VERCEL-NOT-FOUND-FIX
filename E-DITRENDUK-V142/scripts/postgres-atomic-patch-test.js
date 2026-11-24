'use strict';
const assert=require('node:assert/strict');
const {createPostgresPayloadRepository}=require('../backend/postgres-payload-repository');
(async()=>{
 const calls=[];const pool={async query(sql,args){calls.push({sql,args});return {rows:[{id:args[0],payload:{id:args[0],a:1,b:2}}]}}};
 const repo=createPostgresPayloadRepository(pool);
 const result=await repo.patch('monitoring','m_1',{a:1});
 assert.equal(result.id,'m_1');assert.match(calls[0].sql,/payload=payload \|\| \$2::jsonb/);
 assert.deepEqual(calls[0].args,['m_1',JSON.stringify({a:1})]);
 await assert.rejects(()=>repo.patch('invalid','x',{}),/Resource tidak didukung/);
 await assert.rejects(()=>repo.patch('monitoring','x',[]),/Patch harus berupa objek/);
 console.log('PostgreSQL atomic PATCH tests passed');
})().catch(e=>{console.error(e);process.exitCode=1});
