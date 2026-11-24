'use strict';
const crypto=require('node:crypto');
// Atomic counter shared across app instances. PostgreSQL must have ed_request_limits table.
function createSharedLimiter(pool,{prefix,limit,windowMs,now=Date.now}){
 if(!pool||typeof pool.query!=='function'||!prefix||!Number.isSafeInteger(limit)||limit<1||!Number.isSafeInteger(windowMs)||windowMs<1000)throw Error('Konfigurasi rate limiter tidak valid');
 return {async allow(key){
  const stamp=now();const bucket=Math.floor(stamp/windowMs);
  const id=crypto.createHash('sha256').update(prefix+'\0'+String(key)).digest('hex');
  // Uses ON CONFLICT to increment atomically, even with multiple Node replicas.
  const {rows}=await pool.query(`INSERT INTO ed_request_limits (scope_key,bucket,count,expires_at)
   VALUES ($1,$2,1,to_timestamp($3 / 1000.0))
   ON CONFLICT (scope_key,bucket) DO UPDATE SET count=ed_request_limits.count+1
   RETURNING count`,[id,bucket,(bucket+1)*windowMs]);
  return Number(rows[0]?.count)<=limit;
 }};
}
module.exports={createSharedLimiter};
