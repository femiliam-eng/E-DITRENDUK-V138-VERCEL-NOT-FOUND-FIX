'use strict';
const assert=require('node:assert/strict');
const {run,validOrigin,checks}=require('./v121-go-live-smoke');
const respond=(route,overrides={})=>{
  const isHtml=route==='/login.html',isHealth=route==='/api/health',isReady=route==='/api/ready',isUnauthorized=['/api/auth/me','/api/accounts'].includes(route);
  const status=isHtml||isHealth||isReady?200:isUnauthorized?401:404;
  const data=isHealth||isReady?{ok:true,driver:'postgresql'}:{ok:false};
  return {status,headers:{get:()=>isHtml?'text/html':isHealth||isReady||isUnauthorized?'application/json':'text/plain'},text:async()=>'<html><title>Login E-DITRENDUK</title></html>',json:async()=>data,...overrides};
};
(async()=>{
  assert.equal(checks.length,8);
  assert.throws(()=>validOrigin('http://example.org'),/HTTPS/);
  assert.throws(()=>validOrigin('https://u:p@example.org'),/HTTPS/);
  assert.throws(()=>validOrigin('https://example.org/path'),/HTTPS/);
  assert.equal(validOrigin('http://127.0.0.1:3000/',true).hostname,'127.0.0.1');
  const mock=async u=>respond(u.pathname);
  assert.equal((await run('https://portal.example.go.id/',{fetchImpl:mock})).ok,true);
  let r=await run('https://portal.example.go.id/',{fetchImpl:async u=>u.pathname==='/api/ready'?respond(u.pathname,{json:async()=>({ok:true,driver:'sqlite'})}):respond(u.pathname)});
  assert.equal(r.ok,false);assert.equal(r.results.find(x=>x.route==='/api/ready').ok,false);
  r=await run('https://portal.example.go.id/',{fetchImpl:async u=>u.pathname==='/api/accounts'?respond(u.pathname,{status:200}):respond(u.pathname)});
  assert.equal(r.ok,false);
  r=await run('https://portal.example.go.id/',{fetchImpl:async u=>u.pathname==='/login.html'?respond(u.pathname,{text:async()=>'<html>Other website</html>'}):respond(u.pathname)});
  assert.equal(r.ok,false);
  r=await run('https://portal.example.go.id/',{fetchImpl:async u=>u.pathname==='/.env'?respond(u.pathname,{status:200}):respond(u.pathname)});
  assert.equal(r.ok,false);
  r=await run('https://portal.example.go.id/',{fetchImpl:async u=>u.pathname==='/api/ready'?respond(u.pathname,{status:503}):respond(u.pathname)});
  assert.equal(r.ok,false);
  console.log('PASS V121 go-live URL gate: 8 endpoints, false-positive homepage/SQLite/DB/auth/leaked files rejected');
})().catch(e=>{console.error(e);process.exitCode=1});
