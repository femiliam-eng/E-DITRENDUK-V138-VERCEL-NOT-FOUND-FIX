'use strict';
const assert=require('node:assert/strict');
const inventory=require('./postgres-cutover-inventory');
assert.equal(typeof inventory.ready,'boolean');
assert.ok(inventory.findings.sqliteDatabaseOpen>0,'Inventory must detect SQLite open');
assert.ok(inventory.findings.sqliteDirectQuery>0,'Inventory must detect direct SQLite queries');
assert.ok(inventory.findings.sqliteRepositoryConstruction>0,'Inventory must detect legacy repositories');
assert.equal(inventory.ready,false,'Do not mark the hybrid runtime ready');
console.log('PASS: migration inventory detects live SQLite blockers');
