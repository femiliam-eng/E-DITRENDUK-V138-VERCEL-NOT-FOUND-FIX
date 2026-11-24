'use strict';
const assert=require('node:assert/strict');
const {inventory}=require('./v83-runtime-inventory');
const result=inventory();
assert.equal(result.productionReady,false);
assert(result.counts.find(x=>x.id==='sqlite-open').count>0);
assert(result.blockers.some(x=>x.includes('Production gate')));
assert(result.blockers.length>=2);
console.log('PASS V83: SQLite/PG runtime blockers detected; no false production-ready claim');
