#!/usr/bin/env node
'use strict';
// Static, non-destructive deployment audit. Never prints environment values.
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function assess({env=process.env,files={}}={}){
 const get=p=>Object.hasOwn(files,p)?files[p]:read(p);
 const server=get('server.js'),compose=get('compose.yaml'),docker=get('Dockerfile');
 const results=[];const add=(id,pass,reason)=>results.push({id,status:pass?'PASS':'BLOCK',reason});
 add('sqlite-runtime-eliminated',!(/\bopenDatabase\s*\(/.test(server)&&/createPayloadRepository\(db\)/.test(server)),'Runtime masih menginisialisasi SQLite dan repository lokal');
 add('postgres-production-enabled',!/if\s*\(IS_PROD\s*&&\s*PG_PRIMARY_AUTH\)\s*throw/.test(server),'Production menolak autentikasi PostgreSQL parsial');
 add('sqlite-compose-removed',!/DB_DRIVER:\s*sqlite\b/.test(compose),'Compose masih memaksa SQLite');
 add('no-unsafe-sqlite-override',!/ALLOW_SQLITE_PUBLIC/.test(compose),'Jangan mengaktifkan pengecualian SQLite publik');
 add('no-exposed-postgres-port',!/\n\s+ports:\s*\n\s+-\s*['"]?\d+:5432/.test(compose),'Database tidak boleh dipublikasikan langsung');
 add('docker-nonroot',/\bUSER\s+(?:node|\d{2,})\b/.test(docker),'Container aplikasi harus memakai pengguna non-root');
 const validUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!!u.hostname&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash&&!/example\.|\.invalid$/.test(u.hostname)}catch{return false}};
 add('https-origin',validUrl(env.APP_ORIGIN),'APP_ORIGIN harus domain HTTPS asli');
 add('public-url',validUrl(env.PUBLIC_URL),'PUBLIC_URL harus domain HTTPS asli');
 add('origin-matches-url',validUrl(env.APP_ORIGIN)&&env.APP_ORIGIN===env.PUBLIC_URL,'APP_ORIGIN dan PUBLIC_URL harus sama');
 add('session-secret',!!env.SESSION_SECRET&&Buffer.byteLength(env.SESSION_SECRET)>=32&&!/^(REPLACE|ganti-secret)/i.test(env.SESSION_SECRET),'SESSION_SECRET kuat dan unik');
 let pg=false;try{const u=new URL(env.DATABASE_URL);pg=['postgres:','postgresql:'].includes(u.protocol)&&!!u.hostname&&!!u.username&&!!u.password&&!['localhost','127.0.0.1'].includes(u.hostname)}catch{}
 add('managed-postgres',pg,'DATABASE_URL ke PostgreSQL terkelola wajib tersedia');
 add('private-object-storage',env.NOTULEN_STORAGE_PROVIDER==='supabase'&&!!env.SUPABASE_URL&&!!env.SUPABASE_SERVICE_ROLE_KEY&&!!env.SUPABASE_STORAGE_BUCKET,'Storage privat dan kredensial server wajib dikonfigurasi');
 add('production-mode',env.NODE_ENV==='production','NODE_ENV=production wajib');
 const blocked=results.filter(r=>r.status==='BLOCK');return {ready:blocked.length===0,passed:results.length-blocked.length,total:results.length,results};
}
if(require.main===module){const r=assess();for(const x of r.results)console.log(`${x.status} ${x.id}: ${x.reason}`);console.log(`RESULT ${r.passed}/${r.total}; ${r.ready?'CONFIGURATION PASS (live tests still required)':'NOT READY FOR PUBLIC DEPLOYMENT'}`);if(!r.ready)process.exitCode=2}
module.exports={assess};
