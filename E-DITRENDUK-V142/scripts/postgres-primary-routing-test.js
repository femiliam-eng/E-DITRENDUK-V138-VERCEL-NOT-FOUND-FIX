'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const server=fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
for(const fragment of [
 "PG_PRIMARY_PAYLOAD === '1'",
 'await primaryRows(table)',
 'await primaryGet(table,newId)',
 'await primaryCreate(table,newId,row)',
 'await primaryUpdate(table,id,row)',
 'await primaryRemove(table,id)',
 "monitoring:await primaryRows('monitoring')",
 "Mode hybrid PostgreSQL/SQLite belum disetujui untuk production"
]) assert.ok(server.includes(fragment),`Routing wajib: ${fragment}`);
const {createPostgresPayloadRepository}=require('../backend/postgres-payload-repository');
const calls=[];
const repo=createPostgresPayloadRepository({async query(sql,params){calls.push({sql,params});return {rows:[{id:'test-1',payload:{id:'test-1',topic:'rapat'}}],rowCount:1};}});
(async()=>{
 await repo.list('monitoring');await repo.get('monitoring','test-1');await repo.create('monitoring','test-1',{id:'test-1'});await repo.update('monitoring','test-1',{id:'test-1'});await repo.remove('monitoring','test-1');
 assert.equal(calls.length,5);
 assert.ok(calls.every(c=>c.sql.includes('monitoring')));
 console.log('V45 PostgreSQL primary routing contract PASS (mock; bukan tes koneksi PostgreSQL langsung)');
})().catch(e=>{console.error(e);process.exitCode=1});
