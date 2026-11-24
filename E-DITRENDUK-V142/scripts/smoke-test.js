'use strict';
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.SMOKE_PORT || 3099);
const base = `http://127.0.0.1:${PORT}`;
let cookie = '';
function request(method, pathname, body) {
  return new Promise((resolve,reject)=>{
    const raw=body===undefined?null:JSON.stringify(body);
    const req=http.request(base+pathname,{method,headers:{...(raw?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(raw)}:{}),...(cookie?{Cookie:cookie}:{})}},res=>{
      let data=''; res.on('data',c=>data+=c); res.on('end',()=>{
        if(res.headers['set-cookie']) cookie=res.headers['set-cookie'][0].split(';')[0];
        let parsed=data; try{parsed=JSON.parse(data)}catch{}
        resolve({status:res.statusCode,headers:res.headers,body:parsed});
      });
    }); req.on('error',reject); if(raw)req.write(raw); req.end();
  });
}
function assert(cond,msg){if(!cond)throw new Error(msg)}
async function waitReady(){for(let i=0;i<40;i++){try{const r=await request('GET','/api/ready');if(r.status===200)return;}catch{} await new Promise(r=>setTimeout(r,150));}throw new Error('Server smoke test tidak siap.');}
(async()=>{
  const child=spawn(process.execPath,['server.js'],{cwd:ROOT,env:{...process.env,PORT:String(PORT),ACCESS_LOG:'0'},stdio:['ignore','pipe','pipe']});
  let stderr=''; child.stderr.on('data',d=>stderr+=d);
  try{
    await waitReady();
    let r=await request('GET','/api/health'); assert(r.status===200&&r.body.version==='14','health gagal');
    r=await request('GET','/server.js'); assert(r.status===404,'source backend terekspos');
    r=await request('POST','/api/auth/login',{username:'femilia',password:'Ditrenduk2026!'}); assert(r.status===200,'login admin gagal');
    r=await request('GET','/api/auth/me'); assert(r.status===200&&r.body.user,'auth/me gagal');
    r=await request('GET','/api/dashboard'); assert(r.status===200&&r.body.data,'dashboard gagal');
    r=await request('GET','/api/monitoring?page=1&limit=5'); assert(r.status===200&&r.body.data.length<=5&&r.body.pagination,'pagination monitoring gagal');
    r=await request('GET','/api/admin/diagnostics'); assert(r.status===200&&r.body.data.database.integrity==='ok','diagnostics gagal');
    r=await request('POST','/api/auth/logout',{}); assert(r.status===200,'logout gagal');
    console.log('Smoke test V14: LULUS (health, static protection, login, session, dashboard, pagination, diagnostics, logout).');
  } finally { child.kill('SIGTERM'); await new Promise(r=>setTimeout(r,250)); }
})().catch(e=>{console.error('Smoke test V14: GAGAL -',e.message);process.exitCode=1;});
