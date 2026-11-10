#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const {createApp}=require('../server-postgres');
const source=fs.readFileSync(path.join(__dirname,'../js/layout.js'),'utf8');
assert(source.includes('if(currentUser?.mustChangePassword){openPasswordModal(true);return;}try{const boot='),'first login must show password modal before bootstrap');
assert(source.includes('if(force){location.reload();return;}'),'first login must resume after reload');
async function scenario(mustChange){
 const salt='12ab34cd56ef7890';
 const account={id:'acc_one',username:'first',password_hash:salt+':'+crypto.scryptSync('StartPass1!',salt,64).toString('hex'),name:'Pertama',role:'Superadmin',status:'Aktif',unit:'DITRENDUK',permissions:['pengguna'],must_change_password:mustChange};
 const sessions=new Map();let writes=0;
 const pool={async query(sql,args=[]){
  if(sql.includes('INSERT INTO ed_request_limits'))return {rows:[{count:1}]};
  if(sql.includes('FROM accounts WHERE lower(username)'))return {rows:[account]};
  if(sql.includes('FROM accounts WHERE id=$1'))return {rows:[account]};
  if(sql.startsWith('INSERT INTO auth_sessions')){sessions.set(args[2],{id:args[0],account_id:account.id,token_hash:args[2]});return {rowCount:1,rows:[]}};
  if(sql.includes('FROM auth_sessions WHERE token_hash=$1'))return {rows:sessions.has(args[0])?[sessions.get(args[0])]:[]};
  if(sql.startsWith('UPDATE accounts SET password_hash=')){writes++;account.password_hash=args[1];account.must_change_password=args[2];return {rowCount:1,rows:[]}};
  if(sql.startsWith('UPDATE auth_sessions SET revoked_at'))return {rowCount:0,rows:[]};
  if(sql.startsWith('UPDATE auth_sessions SET last_seen_at'))return {rowCount:1,rows:[]};
  if(sql.includes('FROM accounts ORDER BY name,id'))return {rows:[account]};
  throw Error('Unexpected SQL: '+sql);
 }};
 const server=createApp({pool});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'first',password:'StartPass1!'})});
  assert.equal(login.status,200);
  assert.equal((await login.json()).user.mustChangePassword,mustChange);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const call=async(route,opts={})=>fetch(base+route,{...opts,headers:{cookie,...opts.headers}});
  const me=await call('/api/auth/me');assert.equal(me.status,200);assert.equal((await me.json()).user.mustChangePassword,mustChange);
  const accounts=await call('/api/accounts');
  assert.equal(accounts.status,mustChange?403:200);
  if(mustChange){
   assert.equal((await accounts.json()).code,'PASSWORD_CHANGE_REQUIRED');
   assert.equal((await call('/api/bootstrap')).status,403);
   assert.equal((await call('/api/profile/photo')).status,403);
   const change=await call('/api/auth/change-password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({currentPassword:'StartPass1!',newPassword:'AnotherStrongP4ss!'})});
   assert.equal(change.status,200);
   assert.equal(writes,1);
   assert.equal(account.must_change_password,false);
   assert.equal((await call('/api/accounts')).status,200);
  }
 }finally{await new Promise(r=>server.close(r))}
}
(async()=>{await scenario(true);await scenario(false);console.log('PASS V129 HTTP: temporary password cannot access data before change, password change restores access, permanent users unaffected');})().catch(e=>{console.error(e);process.exitCode=1});
