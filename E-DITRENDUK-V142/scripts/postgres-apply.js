'use strict';
const {spawnSync}=require('node:child_process');const path=require('node:path');
const url=process.env.DATABASE_URL;if(!url){console.error('DATABASE_URL belum diatur.');process.exit(1)}
const schema=path.resolve(__dirname,'..','postgres','schema.sql');
const r=spawnSync('psql',[url,'-v','ON_ERROR_STOP=1','-f',schema],{stdio:'inherit'});
if(r.error?.code==='ENOENT'){console.error('psql tidak ditemukan. Install PostgreSQL client terlebih dahulu.');process.exit(1)}
process.exitCode=r.status||0;
