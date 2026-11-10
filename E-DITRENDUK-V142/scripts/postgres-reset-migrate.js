'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
if(!process.env.DATABASE_URL){console.error('DATABASE_URL wajib');process.exit(1)}
const sql=path.resolve(__dirname,'../postgres/migrations/v67-password-reset.sql');
const r=spawnSync('psql',[process.env.DATABASE_URL,'-X','-v','ON_ERROR_STOP=1','-f',sql],{env:process.env,stdio:'inherit'});
if(r.error){console.error(r.error.message);process.exit(1)}
if(r.status!==0)process.exit(r.status||1);
console.log('PASS PostgreSQL password-reset migration');
