'use strict';
const assert=require('node:assert/strict');
const {createPostgresReadGateway}=require('../backend/postgres-read-gateway');
(async()=>{
 const calls=[];
 const gateway=createPostgresReadGateway({pool:{async query(sql,params){calls.push([sql,params]);if(sql.includes('COUNT('))return {rows:[{total:4}]};if(sql.includes('WHERE id='))return {rows:params[0]==='missing'?[]:[{id:params[0],payload:{status:'Aktif'}}]};return {rows:[{id:'m1',payload:{status:'Aktif'}}]};}}});
 assert.deepEqual(await gateway.list('monitoring',12,24),[{id:'m1',status:'Aktif'}]);
 assert.deepEqual(calls[0][1],[12,24]);
 assert.match(calls[0][0],/LIMIT \$1 OFFSET \$2/);
 assert.deepEqual(await gateway.get('monitoring','m1'),{id:'m1',status:'Aktif'});
 assert.equal(await gateway.get('monitoring','missing'),null);
 assert.equal(await gateway.count('monitoring'),4);
 await assert.rejects(()=>gateway.list('accounts'),/tidak didukung/);
 await assert.rejects(()=>gateway.list('monitoring',101),/limit/);
 await assert.rejects(()=>gateway.list('monitoring',10,-1),/offset/);
 await assert.rejects(()=>gateway.get('monitoring',''),/id/);
 await assert.rejects(()=>gateway.get('accounts','m1'),/tidak didukung/);
 console.log('V37 PostgreSQL read gateway pagination/detail test LULUS');
})().catch(e=>{console.error(e);process.exitCode=1});
