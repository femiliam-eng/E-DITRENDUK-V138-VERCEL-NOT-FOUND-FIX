'use strict';
const assert=require('node:assert/strict');
const {createPostgresPasswordResetRepository}=require('../backend/postgres-password-reset-repository');
(async()=>{
 const queries=[];
 const pool={query:async(sql,args)=>{queries.push({sql,args});if(sql.includes('SELECT id,username,name'))return {rows:[{id:'a',name:'Alfina',username:'alfina'}]};if(sql.includes('INSERT INTO'))return {rowCount:1};if(sql.includes('SELECT r.id'))return {rows:[{id:'r',status:'Menunggu',name:'Alfina',username:'alfina'}]};return {rows:[]}},connect:async()=>({query:async(sql,args)=>{queries.push({sql,args});if(sql.includes('SELECT account_id'))return {rows:[{account_id:'a'}]};return {rowCount:1}},release(){}})};
 const repo=createPostgresPasswordResetRepository(pool);
 assert.equal((await repo.activeIdentity('alfina')).id,'a');
 assert.equal(await repo.request('r','a','alfina'),true);
 assert.equal((await repo.list())[0].status,'Menunggu');
 assert.equal(await repo.resolve('r','hash','admin'),true);
 assert(queries.some(x=>x.sql.includes('UPDATE auth_sessions')));
 assert(queries.some(x=>x.sql.includes('COMMIT')));
 assert(queries.every(x=>!x.sql.includes('alfina')||x.args?.includes('alfina')),'identity should be parameterized');
 console.log('PASS PostgreSQL password reset repository + atomic transaction');
})().catch(e=>{console.error(e);process.exitCode=1});
