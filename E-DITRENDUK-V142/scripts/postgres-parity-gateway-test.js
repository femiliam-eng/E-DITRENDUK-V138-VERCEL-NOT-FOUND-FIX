'use strict';
const assert=require('node:assert/strict');
const {RESOURCES,compareCounts}=require('../backend/postgres-parity-gateway');
(async()=>{
 const called=[];
 const gateway={async count(resource){called.push(resource);return resource==='archive'?4:2;}};
 const result=await compareCounts(gateway,resource=>resource==='archive'?3:2);
 assert.deepEqual(called,RESOURCES);
 assert.equal(result.match,false);
 assert.equal(result.resources.length,7);
 assert.deepEqual(result.resources.find(x=>x.resource==='archive'),{resource:'archive',sqlite:3,postgres:4,match:false,difference:1});
 assert.equal((await compareCounts({count:async()=>0},()=>0)).match,true);
 await assert.rejects(()=>compareCounts({count:async()=>0},()=>-1),/tidak valid/);
 console.log('V38 PostgreSQL parity HTTP helper test LULUS');
})().catch(e=>{console.error(e);process.exitCode=1});
