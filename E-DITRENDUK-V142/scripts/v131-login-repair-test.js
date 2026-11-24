'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {inspect,scan,args,run}=require('./v131-recover-accounts');
const {check}=require('./postgres-check');
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'v131-'));
 try{
  const file=path.join(tmp,'old.sqlite');const db=new DatabaseSync(file);
  db.exec('CREATE TABLE accounts(id TEXT,username TEXT,password_hash TEXT,name TEXT); INSERT INTO accounts VALUES (\'1\',\'old\',\'hash\',\'Old\')');db.close();
  assert.equal(inspect(file).accounts,1);
  assert.equal(scan(tmp).length,1);
  assert.equal(args(['--apply',`--source=${file}`]).apply,true);
  await assert.rejects(run([`--source=${file}`,'--apply'],{DATABASE_URL:'postgresql://invalid',CONFIRM_AUTH_IMPORT:'NO'}),/CONFIRM_AUTH_IMPORT/);
  const queries=[];
  class FakeClient{async connect(){}async query(q){queries.push(q);if(q.includes('information_schema'))return {rows:[{database:'editrenduk',accounts_table:1}]};return {rows:[{n:0,admins:0}]};}async end(){}}
  const c=await check('postgresql://local/test',FakeClient);
  assert.equal(c.accounts,0);assert.equal(c.ok,true);
  assert.equal(queries.length,2);
  console.log('PASS V131 SQLite discovery, account count, safety confirmation, PostgreSQL check without psql');
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
