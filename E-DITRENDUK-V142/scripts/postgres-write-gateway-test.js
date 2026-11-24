'use strict';
const assert=require('node:assert/strict');
const {createPostgresPayloadRepository}=require('../backend/postgres-payload-repository');
(async()=>{
 const calls=[];
 const pool={async query(sql,params=[]){calls.push({sql,params}); if(sql.startsWith('DELETE'))return {rowCount:1}; return {rows:[{id:'abc',payload:{id:'abc',name:'Uji'}}]};}};
 const repo=createPostgresPayloadRepository(pool);
 assert.equal((await repo.create('monitoring','abc',{id:'abc',name:'Uji'})).id,'abc');
 assert.equal(JSON.parse(calls[0].params[1]).name,'Uji');
 assert.match(calls[0].sql,/\$2::jsonb/);
 await repo.update('monitoring','abc',{id:'abc'});
 assert.match(calls[1].sql,/WHERE id=\$1/);
 assert.equal(await repo.remove('monitoring','abc'),true);
 await assert.rejects(()=>repo.create('accounts','abc',{}),/Resource tidak didukung/);
 console.log('PostgreSQL write gateway contract PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
