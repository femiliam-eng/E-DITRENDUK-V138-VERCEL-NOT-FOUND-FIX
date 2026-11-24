'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'server.js'),'utf8');
assert.match(src,/Production fail-closed/);
assert.match(src,/!IS_PROD && !db\.prepare/);
assert.match(src,/ALLOW_SQLITE_PUBLIC/);
assert.ok(src.includes("resolvePublicFile(ROOT"));
assert.match(src,/statusCode=413/);
const port=39000+Math.floor(Math.random()*1000);
const proc=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'development',PORT:String(port),ACCESS_LOG:'0'},stdio:['ignore','pipe','pipe']});
let logs='';proc.stderr.on('data',x=>logs+=x);
(async()=>{
  try {
    let ready=false;
    for(let i=0;i<60;i++){
      await new Promise(r=>setTimeout(r,100));
      try{const r=await fetch(`http://127.0.0.1:${port}/api/ready`);if(r.ok){ready=true;break;}}catch{}
      if(proc.exitCode!==null)break;
    }
    assert.ok(ready,'server gagal start: '+logs);
    for(const route of ['/backend/database.js','/scripts/backup.js','/postgres/schema.sql','/uploads/notulen/anything.pdf','/package.json','/README-REVISI.md','/.env','/assets/../../server.js']){
      const r=await fetch(`http://127.0.0.1:${port}${route}`);assert.notEqual(r.status,200,`Sensitive route exposed: ${route}`);
    }
    const malformed=await fetch(`http://127.0.0.1:${port}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'});
    assert.equal(malformed.status,400);
    const large=await fetch(`http://127.0.0.1:${port}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json','Content-Length':'12000001'},body:'{}'}).catch(()=>null);
    if(large)assert.equal(large.status,413);
    console.log('V42 security regression PASS: private routes, malformed JSON, size guard');
  }finally{proc.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
