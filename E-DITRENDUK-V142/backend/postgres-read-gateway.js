'use strict';
const { tableFor } = require('./postgres-payload-repository');
function createPostgresReadGateway({connectionString, pool}={}) {
  if (!pool) {
    if (!connectionString) throw new Error('DATABASE_URL wajib untuk PG_READ_PREVIEW=1');
    let Pool;
    try { ({Pool} = require('pg')); } catch { throw new Error('Install dependency PostgreSQL: npm install'); }
    pool = new Pool({connectionString, password:process.env.PGPASSWORD||undefined, max:3, connectionTimeoutMillis:5000, idleTimeoutMillis:10000});
  }
  if (typeof pool.query !== 'function') throw new TypeError('pool.query wajib tersedia');
  const decode = row => ({id:row.id,...(typeof row.payload==='string'?JSON.parse(row.payload):row.payload)});
  return {
    pool,
    async list(resource, limit=25, offset=0) {
      const table=tableFor(resource);
      if (!Number.isInteger(limit) || limit<1 || limit>100) throw new RangeError('limit harus 1-100');
      if (!Number.isSafeInteger(offset) || offset<0 || offset>1000000) throw new RangeError('offset harus 0-1000000');
      const result=await pool.query(`SELECT id, payload, updated_at FROM ${table} ORDER BY id LIMIT $1 OFFSET $2`,[limit,offset]);
      return result.rows.map(decode);
    },
    async get(resource,id) {
      const table=tableFor(resource);
      if(typeof id!=='string'||!id.trim()||id.length>200) throw new TypeError('id tidak valid');
      const result=await pool.query(`SELECT id, payload, updated_at FROM ${table} WHERE id=$1 LIMIT 1`,[id]);
      return result.rows[0]?decode(result.rows[0]):null;
    },
    async count(resource) {
      const table=tableFor(resource);
      const result=await pool.query(`SELECT COUNT(*)::int AS total FROM ${table}`);
      return Number(result.rows[0]?.total||0);
    },
    async close() { if(typeof pool.end==='function') await pool.end(); }
  };
}
module.exports={createPostgresReadGateway};
