#!/usr/bin/env node
'use strict';
// Read-only cross-role acceptance check for the actual deployed URL. Never prints credentials,
// session cookies, or employee account contents. Logout only revokes test sessions.
const {validOrigin}=require('./v121-go-live-smoke');
const ROLES=[{key:'admin',name:'Superadmin',user:'SMOKE_ADMIN_USERNAME',pass:'SMOKE_ADMIN_PASSWORD',accounts:200},{key:'employee',name:'Pegawai',user:'SMOKE_EMPLOYEE_USERNAME',pass:'SMOKE_EMPLOYEE_PASSWORD',accounts:403}];
function sanitizedError(){return 'Permintaan gagal atau tidak memenuhi kontrak HTTP.';}
async function run(env=process.env,{fetchImpl=globalThis.fetch,allowLocal=false}={}){
 let origin;
 try{origin=validOrigin(env.APP_ORIGIN,allowLocal).origin;}
 catch{return {ok:false,stage:'configuration',issues:['APP_ORIGIN harus origin HTTPS yang valid.']};}
 for(const role of ROLES){if(!env[role.user]||!env[role.pass]||String(env[role.user]).trim().length===0)return {ok:false,stage:'configuration',issues:['Dua akun pengujian dan password harus disediakan melalui environment (bukan source code).']};}
 if(env[ROLES[0].user]===env[ROLES[1].user])return {ok:false,stage:'configuration',issues:['Gunakan akun Superadmin dan Pegawai yang berbeda.']};
 const results=[];
 async function request(route,{method='GET',cookie='',body}={}){
  const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),8000);
  try{
   const response=await fetchImpl(new URL(route,origin),{method,redirect:'manual',signal:ctrl.signal,headers:{Accept:'application/json',...(method!=='GET'?{Origin:origin}:{}) ,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
   const type=response.headers?.get('content-type')||'';
   let json=null;
   if(type.includes('application/json')){try{json=await response.json();}catch{}}
   return {status:response.status,json,cookie:response.headers?.get('set-cookie')||'',type};
  }finally{clearTimeout(timeout);}
 }
 for(const role of ROLES){
  let cookie='';let loggedIn=false;
  try{
   const login=await request('/api/auth/login',{method:'POST',body:{username:env[role.user],password:env[role.pass]}});
   const match=login.cookie.match(/(?:^|;\s*)(ed_session=[^;]+)/);
   if(login.status!==200||login.json?.ok!==true||login.json?.user?.role!==role.name||!match)throw Error('Login failed');
   cookie=match[1];loggedIn=true;
   const me=await request('/api/auth/me',{cookie});
   if(me.status!==200||me.json?.ok!==true||me.json?.user?.role!==role.name)throw Error('Session failed');
   const users=await request('/api/accounts',{cookie});
   if(users.status!==role.accounts||users.json?.ok!==(role.accounts===200))throw Error('Authorization failed');
   results.push({role:role.name,login:true,session:true,accountsAccess:role.accounts,ok:true});
  }catch{results.push({role:role.name,ok:false,error:sanitizedError()});}
  finally{
   if(loggedIn&&cookie){try{const logout=await request('/api/auth/logout',{method:'POST',cookie});if(logout.status!==200||logout.json?.ok!==true){results.at(-1).ok=false;results.at(-1).logout=false;}else results.at(-1).logout=true;}
    catch{results.at(-1).ok=false;results.at(-1).logout=false;}}
  }
 }
 return {ok:results.every(r=>r.ok),stage:'authenticated-roles',origin,results,note:'Uji live ini hanya login, membaca sesi/otorisasi, dan logout dua akun pengujian. Validasi bisnis, data asli, backup/restore dan persetujuan organisasi tetap terpisah.'};
}
if(require.main===module)run().then(report=>{console.log(JSON.stringify(report,null,2));if(!report.ok)process.exitCode=1;}).catch(()=>{console.error('FAIL: pemeriksaan akun live gagal tanpa menampilkan kredensial.');process.exitCode=1;});
module.exports={run,ROLES};
