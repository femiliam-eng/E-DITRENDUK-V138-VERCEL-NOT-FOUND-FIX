'use strict';
// Check PostgreSQL-only production settings without connecting or printing secrets.
const fs=require('node:fs');
const path=require('node:path');
const {validateProductionEnvironment}=require('../backend/postgres-production-readiness');
const file=process.argv[2];
if(!file){console.error('Gunakan: npm run deploy-config-check -- .env');process.exit(1);}
const target=path.resolve(process.cwd(),file);
if(!fs.existsSync(target)){console.error('File konfigurasi tidak ditemukan.');process.exit(1);}
const env={};
for(const line of fs.readFileSync(target,'utf8').split(/\r?\n/)){
 if(!line.trim()||/^\s*#/.test(line))continue;
 const match=line.match(/^\s*([A-Z][A-Z0-9_]*)=(.*)$/);
 if(match)env[match[1]]=match[2].trim().replace(/^(['"])(.*)\1$/,'$2');
}
const errors=validateProductionEnvironment(env);
if(env.NODE_ENV!=='production')errors.push('NODE_ENV harus production.');
if(env.DB_DRIVER==='sqlite')errors.push('DB_DRIVER=sqlite tidak didukung untuk produksi.');
if(errors.length){console.error('Konfigurasi belum siap:\n- '+errors.join('\n- '));process.exit(1);}
console.log('PASS konfigurasi PostgreSQL-only + storage privat (belum memverifikasi koneksi live).');
