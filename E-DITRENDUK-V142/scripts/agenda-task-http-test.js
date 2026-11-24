'use strict';
const {spawn}=require('node:child_process');
const http=require('node:http');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const port=Number(process.env.AGENDA_TASK_TEST_PORT||3195);
const base=`http://127.0.0.1:${port}`;
let cookie='';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function request(method,url,data){
 return new Promise((resolve,reject)=>{
  const raw=data===undefined?null:JSON.stringify(data);
  const req=http.request(base+url,{method,headers:{...(raw?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(raw)}:{}),...(cookie?{Cookie:cookie}:{})}},res=>{
   let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>{if(res.headers['set-cookie'])cookie=res.headers['set-cookie'][0].split(';')[0];let body;try{body=JSON.parse(text)}catch{body=text}resolve({status:res.statusCode,body})});
  });req.on('error',reject);if(raw)req.write(raw);req.end();
 });
}
function assert(x,msg){if(!x)throw Error(msg);}
(async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port),ACCESS_LOG:'0'},stdio:'ignore'});
 let id='';
 try{
  let ready=false;
  for(let i=0;i<50;i++){try{if((await request('GET','/api/ready')).status===200){ready=true;break}}catch{}await sleep(100)}
  assert(ready,'server belum siap');
  assert((await request('GET','/api/task-deadline')).status===401,'akses tanpa login harus ditolak');
  const login=await request('POST','/api/auth/login',{username:'femilia',password:'Ditrenduk2026!'});
  assert(login.status===200,'login pengujian gagal; gunakan database pengujian tanpa mengganti akun admin');
  const create=await request('POST','/api/task-deadline',{tugas:'Pengujian status langsung',status:'not yet',deadline:'2026-10-20'});
  assert(create.status===201,'buat task gagal '+JSON.stringify(create.body)); id=create.body.data.id;
  const patch=await request('PATCH','/api/task-deadline/'+id,{status:'done'});
  assert(patch.status===200&&patch.body.data.status==='done'&&patch.body.data.tugas==='Pengujian status langsung','PATCH harus menjaga kolom lain');
  const get=await request('GET','/api/task-deadline');
  assert(get.status===200&&get.body.data.some(x=>x.id===id&&x.status==='done'),'status tidak tersimpan');
  const invalid=await request('PATCH','/api/task-deadline/'+id,{status:'pending'});
  assert(invalid.status===400,'status tidak dikenal harus ditolak');
  const still=await request('GET','/api/task-deadline');
  assert(still.body.data.some(x=>x.id===id&&x.status==='done'),'validasi gagal mengubah data lama');
  const badDate=await request('PATCH','/api/task-deadline/'+id,{deadline:'2026-02-30'});
  assert(badDate.status===400,'tanggal tidak nyata harus ditolak');
  assert((await request('DELETE','/api/task-deadline/'+id)).status===200,'hapus task uji gagal');
  assert((await request('POST','/api/auth/logout',{})).status===200,'logout gagal');
  assert((await request('GET','/api/task-deadline')).status===401,'akses setelah logout harus ditolak');
  console.log('PASS HTTP Task Deadline: auth, create, inline PATCH, persistence, validation, cleanup, logout');
 }finally{
  try{if(cookie)await request('DELETE','/api/task-deadline/'+id)}catch{}
  child.kill('SIGTERM');await sleep(150);
 }
})().catch(e=>{console.error('FAIL HTTP Task Deadline:',e.message);process.exitCode=1});
