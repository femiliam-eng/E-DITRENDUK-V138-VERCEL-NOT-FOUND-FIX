'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
if(!process.env.DATABASE_URL){console.error('DATABASE_URL wajib.');process.exit(1)}
const migration=path.resolve(__dirname,'../postgres/migrations/v46-notulen-submissions.sql');
const args=[process.env.DATABASE_URL,'-X','-v','ON_ERROR_STOP=1','-f',migration];
const r=spawnSync('psql',args,{stdio:'inherit',env:process.env});
if(r.error){console.error('psql gagal dijalankan:',r.error.message);process.exit(1)}
if(r.status!==0){console.error('Migrasi gagal.');process.exit(r.status||1)}
console.log('Migrasi tabel pengumpulan notulensi PostgreSQL berhasil.');
