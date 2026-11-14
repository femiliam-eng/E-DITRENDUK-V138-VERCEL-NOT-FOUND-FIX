'use strict';
const assert=require('node:assert/strict');
const {PassThrough,Writable}=require('node:stream');
const {EventEmitter}=require('node:events');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {backup}=require('./pg-backup-secure');
const {inspect}=require('./pg-backup-inspect');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'editrenduk-backup-test-'));
const content=Buffer.from('PGDMP test-only archive data');
const pass='a long random passphrase for test only';
function dump(){const p=new EventEmitter();p.stdout=new PassThrough();p.stderr=new PassThrough();p.kill=()=>{};process.nextTick(()=>{p.stdout.end(content);p.emit('close',0)});return p}
function restore(){const p=new EventEmitter();p.stdin=new PassThrough();p.stdout=new PassThrough();p.stderr=new PassThrough();p.kill=()=>{};let data=Buffer.alloc(0);p.stdin.on('data',b=>data=Buffer.concat([data,b]));p.stdin.on('end',()=>{p.stdout.end('; header\n1; TABLE public example\n');p.emit('close',data.equals(content)?0:1)});return p}
(async()=>{
 try{
  const file=await backup({env:{DATABASE_URL:'postgresql://test.invalid/db',BACKUP_OUTPUT_DIR:dir,BACKUP_ENCRYPTION_PASSPHRASE:pass},spawnImpl:dump,log:()=>{}});
  assert(!fs.readFileSync(file).includes(content),'plaintext must not appear in backup');
  await inspect(file,{passphrase:pass,spawnImpl:restore});
  await assert.rejects(inspect(file,{passphrase:'wrong long passphrase for test',spawnImpl:restore}));
  const data=fs.readFileSync(file);data[data.length-20]^=1;fs.writeFileSync(file,data);
  await assert.rejects(inspect(file,{passphrase:pass,spawnImpl:restore}));
  console.log('PASS V78 encrypted backup roundtrip, wrong key and tampering');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
