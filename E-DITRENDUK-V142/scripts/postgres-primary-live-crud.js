'use strict';
// Runs REAL PostgreSQL CRUD against all seven primary payload tables; always rolls back.
const crypto = require('node:crypto');
const { TABLES, createPostgresPayloadRepository } = require('../backend/postgres-payload-repository');
async function run(client) {
  const repo = createPostgresPayloadRepository(client);
  const passed = [];
  await client.query('BEGIN');
  try {
    for (const table of Object.keys(TABLES)) {
      const id = `v48-smoke-${crypto.randomUUID()}`;
      const initial = { probe: 'v48', step: 1 };
      const created = await repo.create(table,id,initial);
      if (created.id !== id) throw new Error(`${table}: create mismatch`);
      const fetched = await repo.get(table,id);
      if (!fetched || fetched.payload.probe !== 'v48') throw new Error(`${table}: get mismatch`);
      const updated = await repo.update(table,id,{probe:'v48',step:2});
      if (!updated || updated.payload.step !== 2) throw new Error(`${table}: update mismatch`);
      const listed = await repo.list(table);
      if (!listed.some(row=>row.id===id)) throw new Error(`${table}: list mismatch`);
      if (!await repo.remove(table,id)) throw new Error(`${table}: delete mismatch`);
      if (await repo.get(table,id)) throw new Error(`${table}: delete persisted`);
      passed.push(table);
    }
    return passed;
  } finally {
    await client.query('ROLLBACK');
  }
}
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL wajib diatur');
  const { Client } = require('pg');
  const client = new Client({connectionString:process.env.DATABASE_URL,password:process.env.PGPASSWORD||undefined,connectionTimeoutMillis:5000});
  await client.connect();
  try { console.log('PASS PostgreSQL live CRUD (ROLLBACK):', (await run(client)).join(', ')); }
  finally { await client.end(); }
}
if (require.main===module) main().catch(e=>{console.error('FAIL PostgreSQL live CRUD:',e.message);process.exitCode=1;});
module.exports={run};
