'use strict';
// Real PostgreSQL auth/session persistence check; never commits fixture credentials.
const crypto = require('node:crypto');
const { createPostgresAccountRepository } = require('../backend/postgres-account-repository');
const { createPostgresSessionRepository } = require('../backend/postgres-session-repository');
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL wajib diatur');
  const { Client } = require('pg');
  const client = new Client({connectionString:process.env.DATABASE_URL,password:process.env.PGPASSWORD||undefined,connectionTimeoutMillis:5000});
  await client.connect();
  const id = 'v49_auth_'+crypto.randomBytes(9).toString('hex');
  const sessionId = 'v49_sess_'+crypto.randomBytes(9).toString('hex');
  const hash = crypto.randomBytes(32).toString('hex');
  let transaction = false;
  try {
    await client.query('BEGIN'); transaction=true;
    await client.query('INSERT INTO accounts(id,username,email,password_hash,name,role,status) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,id,null,'test-only-not-a-real-password','V49 Rollback Test','Pegawai','Aktif']);
    const accounts=createPostgresAccountRepository(client), sessions=createPostgresSessionRepository(client);
    if ((await accounts.byUsername(id))?.id!==id) throw new Error('Account lookup gagal');
    if ((await accounts.byId(id))?.id!==id) throw new Error('Account ID lookup gagal');
    if (!(await accounts.setPasswordHash(id,'v49-rotated',true))) throw new Error('Password update gagal');
    if ((await accounts.byId(id))?.password_hash!=='v49-rotated') throw new Error('Password verification gagal');
    if (!(await sessions.create({id:sessionId,accountId:id,tokenHash:hash,expiresAt:new Date(Date.now()+3600000).toISOString()}))) throw new Error('Session create gagal');
    if ((await sessions.findActiveByTokenHash(hash,new Date().toISOString()))?.account_id!==id) throw new Error('Session lookup gagal');
    if (!(await sessions.touch(sessionId))) throw new Error('Session touch gagal');
    if (!(await sessions.ownedSession(sessionId,id))) throw new Error('Session ownership gagal');
    if (!(await sessions.revokeByTokenHash(hash))) throw new Error('Session revoke gagal');
    if (await sessions.findActiveByTokenHash(hash,new Date().toISOString())) throw new Error('Session masih aktif setelah revoke');
    await client.query('ROLLBACK'); transaction=false;
    if ((await accounts.byId(id))!==null) throw new Error('Rollback akun gagal');
    console.log('PASS PostgreSQL live auth/session CRUD + ROLLBACK; no fixture retained');
  } finally { if(transaction) await client.query('ROLLBACK'); await client.end(); }
}
if(require.main===module) main().catch(e=>{console.error('FAIL PostgreSQL auth live smoke:',e.message);process.exitCode=1;});
module.exports={main};
