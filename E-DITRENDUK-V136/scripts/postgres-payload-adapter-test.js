'use strict';
const assert = require('node:assert/strict');
const {createPostgresPayloadRepository,tableFor} = require('../backend/postgres-payload-repository');
(async () => {
  const calls=[];
  const client={query:async(sql,values=[])=>{calls.push({sql,values});return {rows:[{id:'x',payload:{a:1}}],rowCount:1}}};
  const repo=createPostgresPayloadRepository(client);
  await repo.list('monitoring');
  await repo.get('monitoring','x');
  await repo.create('monitoring','x',{a:1});
  await repo.update('monitoring','x',{a:2});
  assert.equal(await repo.remove('monitoring','x'),true);
  assert.equal(calls.length,5);
  assert.equal(calls[2].values[1],'{"a":1}');
  assert.match(calls[2].sql,/\$1,\$2::jsonb/);
  assert.deepEqual(calls[3].values,['x','{"a":2}']);
  assert.throws(()=>tableFor('monitoring; DROP TABLE accounts'),/tidak didukung/);
  console.log('V32 PostgreSQL payload adapter self-test LULUS');
})().catch(e=>{console.error(e);process.exitCode=1});
