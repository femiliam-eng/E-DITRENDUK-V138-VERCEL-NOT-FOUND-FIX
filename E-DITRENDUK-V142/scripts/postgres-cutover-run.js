'use strict';
// Explicit, fail-closed data migration orchestration. Does not switch the runtime.
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const apply=process.argv.includes('--apply');
const steps=[['Schema PostgreSQL','postgres-apply'],['Import data SQLite','postgres-import'],['Verifikasi PostgreSQL','postgres-check'],['Perbandingan data','postgres-parity']];
function abort(message){console.error('CUTOVER BLOCKED: '+message);process.exit(2)}
if(!process.env.DATABASE_URL)abort('DATABASE_URL belum disetel.');
let parsed;try{parsed=new URL(process.env.DATABASE_URL)}catch{abort('DATABASE_URL tidak valid.')} 
if(!['postgres:','postgresql:'].includes(parsed.protocol))abort('DATABASE_URL harus PostgreSQL.');
if(!fs.existsSync(path.join(root,'backend/data/editrenduk.sqlite')))abort('Database SQLite sumber tidak ditemukan.');
if(!apply){console.log('DRY RUN: tidak ada database yang diubah.');for(const [label,script] of steps)console.log('- '+label+': npm run '+script);console.log('Untuk menjalankan migrasi data, gunakan --apply setelah backup dan pengujian staging.');process.exit(0)}
if(process.env.CONFIRM_POSTGRES_DATA_IMPORT!=='YES')abort('Set CONFIRM_POSTGRES_DATA_IMPORT=YES setelah membuat backup dan memeriksa target database.');
for(const [label,script] of steps){console.log('Menjalankan: '+label);const result=spawnSync('npm',['run',script],{cwd:root,env:process.env,stdio:'inherit'});if(result.error||result.status!==0)abort(label+' gagal; langkah berikutnya tidak dijalankan.');}
console.log('Migrasi data selesai dan pemeriksaan berhasil. Runtime aplikasi MASIH hybrid; jangan aktifkan production sebelum migrasi endpoint selesai.');
