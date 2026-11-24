'use strict';
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { assertProductionRuntime } = require('../backend/production-runtime-gate');
assert.doesNotThrow(() => assertProductionRuntime({NODE_ENV:'development'}));
assert.doesNotThrow(() => assertProductionRuntime({NODE_ENV:'test'}));
for (const env of [{NODE_ENV:'production'}, {NODE_ENV:'staging'}, {NODE_ENV:'staging',PG_PRIMARY_AUTH:'1',DB_DRIVER:'postgres'}, {NODE_ENV:'production',ALLOW_SQLITE_PUBLIC:'I_UNDERSTAND_THE_RISK',DB_DRIVER:'postgres',PG_PRIMARY_AUTH:'1'}]) {
  assert.throws(() => assertProductionRuntime(env), {code:'PRODUCTION_BLOCKED_SQLITE'});
}
const run=spawnSync(process.execPath,['server.js'],{cwd:require('node:path').join(__dirname,'..'),env:{...process.env,NODE_ENV:'production',ALLOW_SQLITE_PUBLIC:'I_UNDERSTAND_THE_RISK'},encoding:'utf8',timeout:5000});
assert.notEqual(run.status,0);
assert.match(run.stderr,/PUBLIC_DEPLOYMENT_BLOCKED/);
console.log('PASS: production cannot start with SQLite, even with legacy override');
