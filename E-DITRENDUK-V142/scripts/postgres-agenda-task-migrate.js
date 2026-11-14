'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
if(!process.env.DATABASE_URL){console.error('DATABASE_URL wajib.');process.exit(1)}
const migration=path.resolve(__dirname,'../postgres/migrations/v65-agenda-task.sql');
const r=spawnSync('psql',[process.env.DATABASE_URL,'-X','-v','ON_ERROR_STOP=1','-f',migration],{stdio:'inherit',env:process.env});
if(r.error){console.error('psql gagal:',r.error.message);process.exit(1)}
if(r.status!==0)process.exit(r.status||1);
console.log('PASS: migrasi tabel Agenda dan Task Deadline PostgreSQL.');
