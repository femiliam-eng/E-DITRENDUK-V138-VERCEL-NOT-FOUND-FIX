'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {resolveSource,TABLES}=require('./postgres-agenda-task-import');
assert.deepEqual(TABLES,['agenda_kegiatan','task_deadline']);
const expected=path.resolve(__dirname,'../backend/data/editrenduk.sqlite');
const previous=process.env.SQLITE_SOURCE_PATH;
try{
 process.env.SQLITE_SOURCE_PATH='relative.db';
 assert.throws(resolveSource,/absolut/);
 process.env.SQLITE_SOURCE_PATH='/nonexistent/agenda-task-test.sqlite';
 assert.throws(resolveSource,/tidak ditemukan/);
 const tmp=path.resolve(__dirname,'../backend/agenda-task-import.json');
 process.env.SQLITE_SOURCE_PATH=tmp;
 assert.equal(resolveSource(),tmp);
}finally{
 if(previous===undefined)delete process.env.SQLITE_SOURCE_PATH;
 else process.env.SQLITE_SOURCE_PATH=previous;
}
assert(expected.endsWith('/backend/data/editrenduk.sqlite'));
console.log('PASS Agenda/Task import: path resolution, explicit source, fail-closed guards');
