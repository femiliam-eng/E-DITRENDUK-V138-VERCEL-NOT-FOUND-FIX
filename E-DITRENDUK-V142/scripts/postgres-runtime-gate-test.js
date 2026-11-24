'use strict';
const assert=require('node:assert/strict');
const {inspect,REQUIRED}=require('./postgres-runtime-gate');
(async()=>{
 const queries=[];
 const pool={async query(sql,params){queries.push({sql,params});if(sql.includes('current_database()'))return{rows:[{db:'test',version:'18.6'}]};if(sql.includes('information_schema.tables'))return{rows:REQUIRED.map(table_name=>({table_name}))};if(sql.includes('has_schema_privilege'))return{rows:[{schema_usage:true,account_read:true}]};return{rows:[{n:2}]};}};
 const result=await inspect(pool);assert.equal(result.ok,true);assert.equal(Object.keys(result.counts).length,REQUIRED.length);assert.equal(result.counts.accounts,2);assert(queries.some(x=>x.params?.[0]===REQUIRED));
 const missingPool={query:async(sql,params)=>sql.includes('current_database()')?{rows:[{db:'test',version:'18'}]}:sql.includes('information_schema.tables')?{rows:[]}:{rows:[{schema_usage:false,account_read:false}]}};
 assert.equal((await inspect(missingPool)).ok,false);
 console.log('postgres-runtime-gate-test PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
