#!/usr/bin/env node
'use strict';
// Unauthenticated read-only deployment acceptance gate. No passwords or business records are transmitted.
const {URL}=require('node:url');
const checks=[
  {route:'/login.html',expected:200,kind:'html'},
  {route:'/api/health',expected:200,kind:'health'},
  {route:'/api/ready',expected:200,kind:'ready'},
  {route:'/api/auth/me',expected:401,kind:'unauthorized'},
  {route:'/api/accounts',expected:401,kind:'unauthorized'},
  {route:'/.env',expected:404,kind:'hidden'},
  {route:'/server-postgres.js',expected:404,kind:'hidden'},
  {route:'/package.json',expected:404,kind:'hidden'}
];
function validOrigin(input,allowLocal=false){
  const url=new URL(input);
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if((url.protocol!=='https:'&&!(allowLocal&&local&&url.protocol==='http:'))||url.username||url.password||url.search||url.hash||url.pathname!=='/'||!url.hostname)throw Error('Wajib origin HTTPS tanpa path, query, fragment atau kredensial. HTTP hanya untuk pengujian localhost.');
  return url;
}
async function run(origin,{fetchImpl=fetch,allowLocal=false}={}){
  const url=validOrigin(origin,allowLocal),results=[];
  for(const c of checks){
    const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),8000);
    try{
      const response=await fetchImpl(new URL(c.route,url),{method:'GET',redirect:'manual',signal:ctrl.signal,headers:{Accept:'text/html,application/json'}});
      const type=response.headers?.get('content-type')||'';
      let ok=response.status===c.expected;
      if(ok&&c.kind==='html'){
        const body=await response.text();ok=type.includes('text/html')&&/E-DITRENDUK/i.test(body)&&/login/i.test(body);
      }
      if(ok&&['health','ready','unauthorized'].includes(c.kind)){
        if(!type.includes('application/json'))ok=false;
        else {
          const body=await response.json();
          ok=c.kind==='unauthorized'?body?.ok===false:body?.ok===true&&body?.driver==='postgresql';
        }
      }
      results.push({route:c.route,status:response.status,ok});
    }catch(e){results.push({route:c.route,ok:false,error:e.name==='AbortError'?'timeout':'request failed'});}
    finally{clearTimeout(timeout)}
  }
  return {origin:url.origin,ok:results.every(x=>x.ok),results,note:'Gate ini hanya memeriksa URL publik tanpa login. Uji akun karyawan, migrasi, Storage dan backup tetap wajib.'};
}
if(require.main===module){
  const origin=process.argv[2];
  if(!origin){console.error('Penggunaan: npm run go-live-smoke -- https://domain-resmi');process.exitCode=2;}
  else run(origin).then(v=>{console.log(JSON.stringify(v,null,2));if(!v.ok)process.exitCode=1;}).catch(e=>{console.error('FAIL:',e.message);process.exitCode=1;});
}
module.exports={run,validOrigin,checks};
