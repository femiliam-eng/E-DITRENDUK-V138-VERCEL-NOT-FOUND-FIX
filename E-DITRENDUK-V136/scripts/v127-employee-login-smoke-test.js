'use strict';
const assert=require('node:assert/strict');
const {run}=require('./v127-employee-login-smoke');
const env={APP_ORIGIN:'https://portal.instansi.go.id/',SMOKE_ADMIN_USERNAME:'admin-test',SMOKE_ADMIN_PASSWORD:'SECRET-admin',SMOKE_EMPLOYEE_USERNAME:'staff-test',SMOKE_EMPLOYEE_PASSWORD:'SECRET-staff'};
function mock({employeeCanReadAccounts=false,adminRole='Superadmin',logoutFails=false,employeeLoginFails=false}={}){
 let logoutCount=0;
 const fetchImpl=async(url,opt)=>{
  const path=new URL(url).pathname;
  const isEmployee=(opt.headers.Cookie||'').includes('staff-test')||opt.body?.includes('staff-test');
  const role=isEmployee?'Pegawai':adminRole;
  let status=200,result={ok:true},cookie='';
  if(path==='/api/auth/login'){
   if(isEmployee&&employeeLoginFails){status=401;result={ok:false};}
   else {result.user={role};cookie=`ed_session=${isEmployee?'staff-test':'admin-test'}; HttpOnly; Secure; Path=/`;}
  }else if(path==='/api/auth/me')result.user={role};
  else if(path==='/api/accounts'){
   status=isEmployee?(employeeCanReadAccounts?200:403):200;
   result={ok:status===200};
  }else if(path==='/api/auth/logout'){
   logoutCount++;if(logoutFails){status=500;result={ok:false};}
  }else throw Error('Unexpected request: '+path);
  return {status,headers:{get:k=>k==='content-type'?'application/json':k==='set-cookie'?cookie:null},json:async()=>result};
 };
 return {fetchImpl,logoutCount:()=>logoutCount};
}
(async()=>{
 let m=mock();const pass=await run(env,m);assert.equal(pass.ok,true);assert.equal(pass.results.length,2);assert.equal(m.logoutCount(),2);assert.equal(pass.results[1].accountsAccess,403);
 for(const variant of [{employeeCanReadAccounts:true},{adminRole:'Pegawai'},{logoutFails:true},{employeeLoginFails:true}]){
  const bad=await run(env,mock(variant));assert.equal(bad.ok,false,JSON.stringify(variant));
 }
 for(const badEnv of [{...env,SMOKE_EMPLOYEE_PASSWORD:''},{...env,SMOKE_EMPLOYEE_USERNAME:'admin-test'},{...env,APP_ORIGIN:'http://evil.invalid/'}]){
  assert.equal((await run(badEnv,mock())).ok,false);
 }
 const output=JSON.stringify(await run(env,mock({employeeLoginFails:true})));
 assert(!output.includes('SECRET-'));assert(!output.includes('ed_session'));
 console.log('PASS V127: two-role login/session/authorization/logout; 4 fail-closed paths; 3 invalid configurations; no secret leakage');
})().catch(e=>{console.error(e);process.exitCode=1;});
