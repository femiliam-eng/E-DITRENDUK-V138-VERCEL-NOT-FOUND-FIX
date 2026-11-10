'use strict';
// Penggunaan: node scripts/restore.js backups/backup-YYYY-... [--confirm]
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..'), arg=process.argv[2], confirm=process.argv.includes('--confirm');
if(!arg){console.error('Pilih folder backup. Contoh: node scripts/restore.js backups/backup-2026-10-01T... --confirm');process.exit(1)}
const src=path.resolve(root,arg), manifestPath=path.join(src,'manifest.json'), srcDb=path.join(src,'editrenduk.sqlite');
if(!fs.existsSync(manifestPath)||!fs.existsSync(srcDb)){console.error('Folder backup tidak valid: manifest/database tidak ditemukan.');process.exit(1)}
const check=new DatabaseSync(srcDb,{readOnly:true});try{if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Database backup rusak.');}finally{check.close()}
if(!confirm){console.log('Backup valid. Ini mode pemeriksaan saja; belum ada file yang diubah. Tambahkan --confirm untuk restore.');process.exit(0)}
const targetDb=path.join(root,'backend','data','editrenduk.sqlite'), targetUploads=path.join(root,'uploads','notulen');
fs.mkdirSync(path.dirname(targetDb),{recursive:true});fs.copyFileSync(srcDb,targetDb);
fs.rmSync(targetUploads,{recursive:true,force:true});
const srcUploads=path.join(src,'uploads','notulen');if(fs.existsSync(srcUploads))fs.cpSync(srcUploads,targetUploads,{recursive:true});else fs.mkdirSync(targetUploads,{recursive:true});
console.log('Restore selesai. Jalankan npm run check-db sebelum npm start.');
