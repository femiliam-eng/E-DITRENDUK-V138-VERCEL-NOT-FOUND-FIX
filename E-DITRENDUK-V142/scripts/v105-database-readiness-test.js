'use strict';
const assert=require('node:assert/strict');
const {checkDatabaseReadiness}=require('../backend/database-readiness');
(async()=>{
 const healthy={prepare:()=>({get:()=>({quick_check:'ok'})})};
 const corrupt={prepare:()=>({get:()=>({quick_check:'database disk image is malformed'})})};
 let pgCalls=0;
 const pool={query:async(sql)=>{assert.equal(sql,'SELECT 1');pgCalls++;return {rows:[{'?column?':1}]}}};
 assert.deepEqual(await checkDatabaseReadiness({sqlite:healthy}),{ok:true,database:'sqlite'});
 assert.deepEqual(await checkDatabaseReadiness({sqlite:healthy,postgresPool:pool,usesPostgres:true}),{ok:true,database:'hybrid-sqlite-postgresql'});
 assert.equal(pgCalls,1);
 assert.equal((await checkDatabaseReadiness({sqlite:corrupt,postgresPool:pool,usesPostgres:true})).ok,false);
 assert.equal(pgCalls,1,'Postgres must not be queried after SQLite integrity failure');
 await assert.rejects(checkDatabaseReadiness({sqlite:healthy,usesPostgres:true}),/pool required/);
 await assert.rejects(checkDatabaseReadiness({sqlite:healthy,postgresPool:{query:async()=>{throw Error('connection refused')}},usesPostgres:true}),/connection refused/);
 console.log('PASS: readiness returns 503 on corrupt SQLite or failed PostgreSQL and checks both hybrid dependencies');
})().catch(e=>{console.error(e);process.exitCode=1});
