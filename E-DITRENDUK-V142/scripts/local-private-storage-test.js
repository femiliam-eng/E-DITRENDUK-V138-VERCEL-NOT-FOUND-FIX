'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createLocalPrivateStorage}=require('../backend/local-private-storage');
(async()=>{const dir=await fs.mkdtemp(path.join(os.tmpdir(),'editrenduk-storage-'));try{
 const storage=createLocalPrivateStorage({directory:dir});
 await storage.put('test_1.pdf',Buffer.from('%PDF-test'));
 assert.equal((await storage.get('test_1.pdf')).toString(),'%PDF-test');
 await assert.rejects(()=>storage.put('test_1.pdf',Buffer.from('overwrite')));
 await assert.rejects(()=>storage.get('../secrets.pdf'));
 await assert.rejects(()=>storage.put('x.pdf',Buffer.alloc(6*1024*1024+1)));
 await storage.remove('test_1.pdf');
 await assert.rejects(()=>storage.get('test_1.pdf'));
 console.log('Local private storage: OK');
}finally{await fs.rm(dir,{recursive:true,force:true})}})().catch(e=>{console.error(e);process.exitCode=1});
